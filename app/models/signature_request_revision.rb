# frozen_string_literal: true

class SignatureRequestRevision < ApplicationRecord
  STATUSES = %w[draft under_review changes_requested approved sending send_uncertain awaiting_signatures signed declined cancelled expired].freeze
  CONTENT_ATTRIBUTES = %w[signature_request_id created_by_id number title documents recipients fields signing_options content_digest].freeze
  ARCHIVE_ERRORS = {
    "provider_mismatch" => "The provider record does not match the approved version. An administrator must reconcile it.",
    "verification_failed" => "Completed files could not be verified. Signed downloads remain unavailable.",
    "connection_unavailable" => "The signing connection is unavailable. Ask an administrator to check it.",
    "provider_unavailable" => "Completed files could not be retrieved. Check the status to retry safely.",
    "storage_unavailable" => "The completed files could not be saved privately. Check the status to retry safely.",
    "queue_unavailable" => "Archive verification could not be queued. Check the status to retry safely."
  }.freeze

  belongs_to :signature_request
  belongs_to :created_by, class_name: "User"
  belongs_to :approved_by, class_name: "User", optional: true
  belongs_to :signature_connection, optional: true
  has_many :signature_operations, foreign_key: :revision_id, dependent: :restrict_with_exception
  has_many :signature_callbacks, foreign_key: :revision_id, dependent: :restrict_with_exception
  has_many :review_invitations, class_name: "SignatureReviewInvitation", foreign_key: :revision_id, dependent: :restrict_with_exception
  has_many :review_comments, class_name: "SignatureReviewComment", foreign_key: :revision_id, dependent: :restrict_with_exception
  has_many_attached :originals
  has_many_attached :signed_artifacts
  serialize :documents, coder: JSON
  serialize :recipients, coder: JSON
  serialize :fields, coder: JSON
  serialize :signing_options, coder: JSON
  serialize :recipient_statuses, coder: JSON
  serialize :artifact_manifest, coder: JSON
  encrypts :documents, :recipients, :fields, :signing_options, :approval_note, :recipient_statuses, :artifact_manifest
  self.filter_attributes += [:title, :documents, :recipients, :fields, :approval_note, :artifact_manifest]
  before_validation :assign_digest, on: :create

  validates :title, presence: true, length: { maximum: 200 }
  validates :number, numericality: { only_integer: true, greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }
  validates :content_digest, format: { with: /\A[0-9a-f]{64}\z/ }
  validate :valid_content, on: :create
  validate :immutable_content, on: :update
  validate :valid_delivery_binding
  validate :valid_archive
  validates :archive_error, inclusion: { in: ARCHIVE_ERRORS.keys }, allow_nil: true

  def configuration
    Signatures::Configuration.new(documents:, recipients:, fields:)
  end

  def delivery_summary
    slice(:operation_id, :provider_envelope_id, :provider_status, :provider_checked_at, :cancel_requested_at,
      :last_reminder_at, :next_reminder_at, :automatic_reminders_count).merge(
      recipient_statuses: recipient_statuses || [], operations: signature_operations.order(id: :desc).limit(10).map(&:summary),
      archive: archive_summary)
  end

  def archive_summary
    { status: archived_at ? "complete" : archive_error ? "failed" : provider_status == "COMPLETED" ? "pending" : "unavailable",
      completed_at: archived_at, error_message: ARCHIVE_ERRORS[archive_error],
      files: archived_at ? artifact_manifest.map { |item| item.except("blob_id") } : [] }
  end

  def queue_reconciliation!
    job = SignatureSyncJob.perform_later(id)
    return true if job && job.successfully_enqueued?

    archive_queue_failed
  rescue ActiveJob::EnqueueError
    archive_queue_failed
  end

  def artifact_bytes(key)
    raise ActiveRecord::RecordNotFound unless archived_at && status == "signed"

    item = artifact_manifest.find { |entry| entry["key"] == key }
    raise ActiveRecord::RecordNotFound unless item

    blob = signed_artifacts.blobs.find(item.fetch("blob_id"))
    data = +"".b
    blob.download do |chunk|
      data << chunk
      raise Signatures::Upload::Unavailable, "The archived document could not be verified." if data.bytesize > Signatures::SealedPdf::MAX_BYTES
    end
    unless !blob.service.public? && data.bytesize == item.fetch("byte_size") && Digest::SHA256.hexdigest(data) == item.fetch("sha256")
      raise Signatures::Upload::Unavailable, "The archived document could not be verified."
    end
    [data, item.except("blob_id")]
  end

  def ready_errors
    failures = configuration.ready_errors
    return failures if failures.any?

    Signatures::Envelope.new(self).payload(operation_id: "approval-check")
    []
  rescue Signatures::Envelope::InvalidConfiguration => error
    [error.message]
  end

  def review_comments_page(before_id: nil)
    raise ActionController::BadRequest unless before_id.nil? || before_id.to_s.match?(/\A[1-9]\d{0,17}\z/)

    records = review_comments.includes(:author_user, author_invitation: :revision).order(id: :desc)
    records = records.where("id < ?", before_id) if before_id
    page = records.limit(31).to_a
    comments = page.first(30).reverse.map do |comment|
      comment.slice(:id, :body, :created_at).merge(author_name: comment.author_name,
        author_kind: comment.author_user_id ? "admin" : "reviewer")
    end
    { comments:, older_before_id: page.size > 30 ? comments.first.fetch("id") : nil }
  end

  def original_bytes(key)
    document = documents.find { |item| item["key"] == key }
    raise ActiveRecord::RecordNotFound unless document

    blob = originals.blobs.find(document.fetch("blob_id"))
    data = +"".b
    blob.download do |chunk|
      data << chunk
      raise Signatures::Upload::Unavailable, "The original document could not be verified." if data.bytesize > Signatures::PdfInfo::MAX_BYTES
    end
    raise Signatures::Upload::Unavailable, "The original document could not be verified." unless Digest::SHA256.hexdigest(data) == document.fetch("sha256")

    [data, document]
  end

  private

    def archive_queue_failed
      signature_request.with_lock do
        reload
        update!(archive_error: "queue_unavailable") unless archived_at
      end
      false
    end

    def valid_archive
      if archived_at_in_database && (%w[artifact_manifest archived_at archive_error].any? { |key| will_save_change_to_attribute?(key) } ||
          attachment_changes.key?("signed_artifacts") || status != "signed" || provider_status != "COMPLETED")
        errors.add(:base, "Completed archives cannot be changed")
      end
      unless archived_at
        errors.add(:base, "Save all verified artifacts before marking this version signed") if status == "signed" ||
          artifact_manifest.present? || signed_artifacts.attached?
        return
      end
      blobs = signed_artifacts.blobs.to_a
      entries = artifact_manifest
      unless status == "signed" && provider_status == "COMPLETED" && entries.is_a?(Array) && entries.size == documents.size + 2 &&
          entries.pluck("kind").sort == (["signed"] * documents.size + %w[certificate audit_log]).sort &&
          entries.select { |item| item["kind"] == "signed" }.pluck("document_key").sort == documents.pluck("key").sort &&
          entries.pluck("key").uniq.size == entries.size && entries.pluck("blob_id").uniq.size == blobs.size && blobs.size == entries.size &&
          entries.all? do |item|
            blob = blobs.find { |file| file.id == item["blob_id"] }
            blob && !blob.service.public? && blob.content_type == "application/pdf" && blob.byte_size == item["byte_size"] &&
              item["sha256"].to_s.match?(/\A[0-9a-f]{64}\z/) &&
              (item["kind"] != "signed" || item["seal_sha256"].to_s.match?(/\A[0-9a-f]{64}\z/))
          end
        errors.add(:base, "Completed archives require every verified private PDF and both evidence files")
      end
    end

    def valid_delivery_binding
      if signature_connection && signature_connection.company_id != signature_request&.company_id
        errors.add(:signature_connection, "must belong to this company")
      end
      %w[signature_connection_id provider_envelope_id operation_id].each do |name|
        if attribute_in_database(name).present? && will_save_change_to_attribute?(name)
          errors.add(name, "cannot be changed after delivery starts")
        end
      end
    end

    def valid_content
      configuration.errors.each { |message| errors.add(:base, message) }
      return if configuration.errors.any?

      unless Signatures::Envelope.valid_options?(signing_options)
        errors.add(:base, "Save a new version with valid signing settings")
        return
      end

      blobs = originals.blobs.to_a
      unless documents.is_a?(Array) && documents.size == blobs.size && documents.sum { |document| document["byte_size"].to_i } <= 25.megabytes &&
          documents.all? do |document|
            blob = blobs.find { |item| item.id == document["blob_id"] }
            blob && !blob.service.public? && blob.content_type == "application/pdf" && blob.byte_size <= Signatures::PdfInfo::MAX_BYTES &&
              document["sha256"] == blob.metadata["signatures_sha256"] && document["byte_size"] == blob.byte_size
          end
        errors.add(:base, "Originals must be validated private PDF uploads")
      end
    end

    def immutable_content
      if CONTENT_ATTRIBUTES.any? { |attribute| will_save_change_to_attribute?(attribute) } || attachment_changes.key?("originals")
        errors.add(:base, "Create a new revision to change its content")
      end
    end

    def assign_digest
      if signature_request&.company
        self.signing_options ||= Signatures::Envelope.default_options(timezone: signature_request.company.resolved_time_zone.tzinfo.name)
      end
      return if configuration.errors.any?

      self.fields = fields.map do |field|
        field.merge(field.slice("x", "y", "width", "height").transform_values { |value| value.round(2) })
      end
      payload = { "title" => title, "documents" => documents.map { |document| document.except("blob_id") },
        "recipients" => recipients, "fields" => fields, "signing_options" => signing_options }
      self.content_digest = Digest::SHA256.hexdigest(JSON.generate(canonical(payload)))
    end

    def canonical(value)
      case value
      when Hash then value.sort.to_h.transform_values { |entry| canonical(entry) }
      when Array then value.map { |entry| canonical(entry) }
      else value
      end
    end
end
