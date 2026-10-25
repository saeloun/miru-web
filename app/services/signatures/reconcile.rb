# frozen_string_literal: true

class Signatures::Reconcile
  def initialize(revision)
    @revision = revision
    @record = revision.signature_request
    @staged = []
    @manifest = []
  end

  def process
    return true if @revision.reload.archived_at

    client = @revision.signature_connection&.client || raise(Signatures::DocumensoClient::ConfigurationError)
    data = observe(client)
    return true unless data

    archive!(client, data) if data["status"] == "COMPLETED"
    true
  rescue Signatures::Envelope::Mismatch, Signatures::Envelope::InvalidConfiguration
    failed("provider_mismatch")
  rescue Signatures::PdfInfo::InvalidDocument
    failed("verification_failed")
  rescue Signatures::DocumensoClient::ConfigurationError
    failed("connection_unavailable")
  rescue Signatures::DocumensoClient::Error
    failed("provider_unavailable")
  rescue Signatures::PdfInfo::Unavailable, ActiveStorage::Error, Signatures::Upload::Unavailable, IOError, SystemCallError
    failed("storage_unavailable")
  ensure
    @staged.each { |blob| blob.purge unless blob.attachments.exists? }
  end

  private

    def archive!(client, data)
      verify_completion!(data)
      data.fetch("envelopeItems").sort_by { |item| item.fetch("order") }.each_with_index do |item, index|
        stage(client.signed(item.fetch("id")), "signed", index:)
      end
      stage(client.certificate(@revision.provider_envelope_id), "certificate")
      stage(client.audit_log(@revision.provider_envelope_id), "audit_log")
      persist!
    end

    def observe(client)
      checked_at = Time.current
      data = client.get(@revision.provider_envelope_id)
      Signatures::Envelope.new(@revision).verify!(data, client:, operation_id: @revision.operation_id, before_send: false)
      raise Signatures::Envelope::Mismatch unless Signatures::Delivery::PROVIDER_STATUSES.include?(data["status"])

      data if Signatures::Snapshot.new(@revision).apply!(data, checked_at:)
    end

    def persist!
      @record.with_lock do
        @revision.reload
        return if @revision.archived_at

        raise Signatures::Envelope::Mismatch unless @revision.provider_status == "COMPLETED" && @revision.status == "awaiting_signatures"

        @revision.signed_artifacts = @staged
        @revision.update!(artifact_manifest: @manifest, archived_at: Time.current, archive_error: nil, status: "signed")
        reconcile_send
        @record.audits.create!(action: "signed_archive_created", associated: @record.company,
          audited_changes: { revision_id: @revision.id, content_digest: @revision.content_digest, artifacts: @manifest.size })
      end
    end

    def reconcile_send
      operation = @revision.signature_operations.find_by(kind: "send", key: @revision.operation_id)
      return unless operation && operation.state != "confirmed"

      operation.update!(state: "confirmed", error_code: nil, run_token: nil, finished_at: Time.current)
      @record.audits.create!(action: "send_reconciled", user: operation.requested_by, associated: @record.company,
        audited_changes: { revision_id: @revision.id, operation_key: operation.key })
    end

    def verify_completion!(data)
      unless @revision.approved_at && @revision.approved_by_id && @revision.approval_digest == @revision.content_digest &&
          data.fetch("recipients").reject { |person| person["role"] == "CC" }.all? { |person| person["signingStatus"] == "SIGNED" } &&
          data.fetch("fields").all? { |field| field["fieldMeta"]["required"] != true || field["inserted"] == true }
        raise Signatures::Envelope::Mismatch
      end
    end

    def stage(bytes, kind, index: nil)
      facts = inspect_pdf(bytes, kind)
      filename = "agreement-v#{@revision.number}-#{index ? "document-#{index + 1}-signed" : kind.tr('_', '-')}.pdf"
      io = StringIO.new(bytes)
      blob = ActiveStorage::Blob.build_after_unfurling(io:, filename:, content_type: "application/pdf", identify: false)
      blob.save!
      @staged << blob
      raise ActiveStorage::IntegrityError if blob.service.public?

      blob.upload_without_unfurling(io)

      @manifest << { "key" => SecureRandom.uuid, "kind" => kind, "filename" => filename, "blob_id" => blob.id,
        "document_key" => index ? @revision.documents[index].fetch("key") : nil,
        "byte_size" => bytes.bytesize, "sha256" => facts.fetch("sha256"), "seal_sha256" => facts["seal_sha256"] }
    end

    def inspect_pdf(bytes, kind)
      verifier = kind == "signed" ? Signatures::SealedPdf : Signatures::PdfInfo
      raise Signatures::PdfInfo::InvalidDocument unless bytes.is_a?(String) && bytes.bytesize.between?(1, verifier::MAX_BYTES)

      Tempfile.create(["signature-artifact", ".pdf"]) do |file|
        file.binmode
        file.write(bytes)
        file.flush
        verifier.new(file.path).process
      end
    end

    def failed(code)
      @record.with_lock do
        @revision.reload
        @revision.update!(archive_error: code) unless @revision.archived_at
      end
      false
    end
end
