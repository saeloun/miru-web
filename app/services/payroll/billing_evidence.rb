# frozen_string_literal: true

class Payroll::BillingEvidence
  VERSION = "miru-billing-evidence-v1"
  TYPES = { "application/pdf" => "pdf", "image/jpeg" => "jpg", "image/png" => "png" }.freeze
  KINDS = %w[pan gst].freeze

  def initialize(facts:, previous:, uploads:, reuse:)
    @facts, @previous, @uploads, @reuse = facts, previous, uploads, reuse
    @owned = []
  end

  def command_files
    @command_files ||= KINDS.to_h do |kind|
      upload = @uploads[kind]
      reuse = @reuse.fetch(kind)
      invalid! unless [true, false].include?(reuse)
      needed = kind == "pan" ? @facts["pan_status"] == "provided" : @facts["gst_status"] == "registered"
      invalid! if upload && reuse || !needed && (upload || reuse)
      value = if upload
        descriptor(upload)
      elsif reuse
        retained = @previous&.evidence_manifest&.dig("files", kind)
        invalid! unless retained && reusable?(kind)
        { "reuse" => retained.fetch("blob_id") }
      end
      invalid! if needed && !value
      [kind, value]
    end.compact
  end

  def upload!
    files = command_files.to_h do |kind, descriptor|
      blob = if descriptor.key?("reuse")
        @previous.evidence_blob(kind)
      else
        upload_blob(kind, descriptor)
      end
      invalid! unless blob && !blob.service.public?
      manifest = if descriptor.key?("reuse")
        @previous.evidence_manifest.fetch("files").fetch(kind)
      else
        descriptor.merge("blob_id" => blob.id.to_s, "checksum" => blob.checksum)
      end
      [kind, manifest]
    end
    { "version" => VERSION, "files" => files }
  end

  def cleanup
    @owned.each do |blob, id|
      next if ConsultantBillingSubmission.where(pan_blob_id: id).or(ConsultantBillingSubmission.where(gst_blob_id: id)).exists? || blob.attachments.exists?

      blob.purge
    rescue StandardError
      Rails.logger.warn("Billing evidence cleanup requires review")
    end
  end

  def self.valid?(submission)
    manifest = submission.evidence_manifest
    return false unless manifest.keys.sort == %w[files version] && manifest["version"] == VERSION && manifest["files"].is_a?(Hash)
    kinds = []
    kinds << "pan" if submission.facts["pan_status"] == "provided"
    kinds << "gst" if submission.facts["gst_status"] == "registered"
    return false unless manifest["files"].keys.sort == kinds.sort

    KINDS.all? do |kind|
      blob = submission.evidence_blob(kind)
      file = manifest["files"][kind]
      next blob.nil? unless file

      blob && !blob.service.public? && file.keys.sort == %w[blob_id byte_size checksum content_type sha256] && file["blob_id"] == blob.id.to_s &&
        file["byte_size"].is_a?(Integer) && file["byte_size"].between?(1, 5.megabytes) && TYPES.key?(file["content_type"]) &&
        file["byte_size"] == blob.byte_size && file["content_type"] == blob.content_type && file["checksum"] == blob.checksum &&
        file["sha256"].is_a?(String) && file["sha256"].match?(/\A[0-9a-f]{64}\z/)
    end
  rescue ActiveRecord::RecordNotFound, KeyError, TypeError
    false
  end

  def self.read!(submission, kind)
    raise Payroll::Workflow::Conflict, "Billing evidence changed or is unavailable" unless KINDS.include?(kind) && valid?(submission)

    file = submission.evidence_manifest.fetch("files")[kind]
    raise ActiveRecord::RecordNotFound unless file

    bytes = +"".b
    begin
      submission.evidence_blob(kind).download do |chunk|
        raise Payroll::Workflow::Conflict if bytes.bytesize + chunk.bytesize > file["byte_size"]
        bytes << chunk
      end
    rescue StandardError
      raise Payroll::Workflow::Conflict, "Billing evidence changed or is unavailable", cause: nil
    end
    unless bytes.bytesize == file["byte_size"] && Digest::SHA256.hexdigest(bytes) == file["sha256"]
      raise Payroll::Workflow::Conflict, "Billing evidence changed or is unavailable"
    end
    [bytes, file["content_type"], "#{kind}-evidence.#{TYPES.fetch(file['content_type'])}"]
  end

  def self.verify!(submission)
    raise Payroll::Workflow::Conflict, "Billing evidence changed or is unavailable" unless valid?(submission)

    submission.evidence_manifest.fetch("files").each_key { |kind| read!(submission, kind) }
  end

  private

    def reusable?(kind)
      fields = kind == "pan" ? %w[pan_status pan_number] : %w[gst_status gst_number gst_scheme]
      self.class.valid?(@previous) && @previous.facts.slice(*fields) == @facts.slice(*fields)
    end

    def descriptor(upload)
      invalid! unless upload.is_a?(ActionDispatch::Http::UploadedFile) && upload.tempfile.size.between?(1, 5.megabytes)
      file = upload.tempfile
      file.rewind
      type = Marcel::MimeType.for(file)
      invalid! unless TYPES.key?(type)
      file.rewind
      { "sha256" => Digest::SHA256.file(file.path).hexdigest, "content_type" => type, "byte_size" => file.size }
    end

    def upload_blob(kind, descriptor)
      io = @uploads.fetch(kind).tempfile
      io.rewind
      blob = ActiveStorage::Blob.build_after_unfurling(io:, filename: "#{kind}-evidence.#{TYPES.fetch(descriptor.fetch('content_type'))}",
        content_type: descriptor.fetch("content_type"), identify: false)
      invalid! if blob.service.public?
      blob.save!
      @owned << [blob, blob.id]
      io.rewind
      begin
        blob.upload_without_unfurling(io)
      rescue StandardError
        raise Payroll::Workflow::Conflict, "Billing evidence upload is unavailable", cause: nil
      end
      blob
    end

    def invalid!
      raise Payroll::ConsultantReview::InvalidInput, "Provide private PDF, JPEG or PNG evidence for the declared identifiers, or explicitly reuse unchanged evidence"
    end
end
