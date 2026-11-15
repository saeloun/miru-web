# frozen_string_literal: true

class Payroll::RemittanceDocuments
  def initialize(instruction, actor:)
    @instruction, @actor = instruction, actor
  end

  def summary
    authorize!(:show?)
    records = documents.includes(:uploader).order(id: :desc).to_a
    invoice = PayrollConsultantInvoice.find_by(company_id: @instruction.company_id, payroll_run_id: @instruction.payroll_run_id,
      employment_id: @instruction.employment_id, payroll_payment_group_id: @instruction.payroll_payment_group_id)
    { id: @instruction.id.to_s, period: @instruction.payroll_run.period.strftime("%Y-%m"), beneficiary: @instruction.beneficiary,
      credit_state: @instruction.credit_state, payment_state: @instruction.display_state, status: records.empty? ? "missing" : "received",
      follow_up_required: records.empty? && %w[partial credited shortfall_resolved].include?(@instruction.credit_state) &&
        PayrollPaymentInstruction::CREDIT_BARRED_TRANSACTIONS.exclude?(@instruction.transaction_status),
      can_upload: policy.create?, invoice_id: invoice&.id&.to_s,
      documents: records.map { |entry| receipt(entry) } }
  end

  def record!(kind:, reason:, expected_document_id:, idempotency_key:, file:)
    authorize!(:create?)
    validate_input!(kind, reason, expected_document_id, idempotency_key)
    descriptor = Payroll::BillingEvidence.file_descriptor(file)
    command = Payroll::ConsultantInvoicePreparation.digest([@instruction.id, kind, reason, expected_document_id.to_s, descriptor])
    existing = locked { replay(idempotency_key, command) || (check_head!(kind, expected_document_id); nil) }
    return existing if existing

    staged = upload(file, descriptor)
    locked do
      replay(idempotency_key, command) || begin
        head = check_head!(kind, expected_document_id)
        documents.create!(company_id: @instruction.company_id, uploader: @actor, previous_document: head, blob: staged, document_kind: kind,
          idempotency_key:, command_digest: command, details: { "reason" => reason.strip, "file" => descriptor.merge("checksum" => staged.checksum) })
      end
    end
  rescue ActiveRecord::RecordNotUnique
    raise Payroll::Workflow::Conflict, "Document history changed; reload before submitting"
  ensure
    cleanup(staged)
  end

  def download(id)
    authorize!(:show?)
    record = documents.find(id)
    bytes, type = Payroll::BillingEvidence.read_file!(record.blob, record.details.fetch("file"))
    authorize!(:show?)
    [bytes, type, "#{record.document_kind}-#{record.id}.#{Payroll::BillingEvidence::TYPES.fetch(type)}"]
  end

  private

    def documents
      PayrollRemittanceDocument.where(payroll_payment_instruction_id: @instruction.id)
    end

    def policy
      PayrollRemittanceDocumentPolicy.new(@actor, @instruction)
    end

    def authorize!(action)
      @instruction.reload
      raise Payroll::Workflow::NotAuthorized, "Remittance evidence is unavailable in this workspace" unless policy.public_send(action)
    end

    def locked
      @instruction.payroll_run.with_lock do
        @instruction.employment.with_lock do
          @instruction.with_lock do
            authorize!(:create?)
            yield
          end
        end
      end
    end

    def replay(key, command)
      existing = PayrollRemittanceDocument.find_by(company_id: @instruction.company_id, uploader_id: @actor.id, idempotency_key: key)
      return unless existing
      raise Payroll::Workflow::Conflict, "This upload command changed; refresh before retrying" unless existing.command_digest == command && existing.payroll_payment_instruction_id == @instruction.id

      existing
    end

    def check_head!(kind, expected)
      head = documents.where(document_kind: kind).order(id: :desc).first
      raise Payroll::Workflow::Conflict, "Document history changed; reload before submitting" unless head&.id.to_s == expected.to_s

      head
    end

    def validate_input!(kind, reason, expected, key)
      unless PayrollRemittanceDocument::KINDS.include?(kind) && reason.is_a?(String) && reason.strip.length.between?(1, 1000) && !reason.match?(/[\x00-\x1f\x7f]/) &&
          expected.is_a?(String) && expected.match?(/\A(?:|[1-9]\d{0,18})\z/) && key.is_a?(String) && key.match?(/\A[A-Za-z0-9_-]{1,100}\z/)
        raise Payroll::ConsultantReview::InvalidInput, "Choose a bank document type, a reason, and the current document version"
      end
    end

    def upload(file, descriptor)
      file.tempfile.rewind
      blob = ActiveStorage::Blob.build_after_unfurling(io: file.tempfile, filename: "remittance.#{Payroll::BillingEvidence::TYPES.fetch(descriptor.fetch('content_type'))}",
        content_type: descriptor.fetch("content_type"), identify: false)
      raise Payroll::Workflow::Conflict, "Private evidence storage is required" if blob.service.public?

      blob.save!
      file.tempfile.rewind
      begin
        blob.upload_without_unfurling(file.tempfile)
      rescue StandardError
        raise Payroll::Workflow::Conflict, "Remittance evidence upload is unavailable", cause: nil
      end
      Payroll::BillingEvidence.read_file!(blob, descriptor.merge("checksum" => blob.checksum))
      blob
    rescue StandardError
      cleanup(blob)
      raise
    end

    def cleanup(blob)
      return if blob.nil? || PayrollRemittanceDocument.exists?(blob_id: blob.id) || blob.attachments.exists?

      blob.purge
    rescue StandardError
      Rails.logger.warn("Remittance evidence cleanup requires review")
    end

    def receipt(entry)
      { id: entry.id.to_s, kind: entry.document_kind, previous_document_id: entry.previous_document_id&.to_s,
        reason: entry.details.fetch("reason"), uploaded_at: entry.created_at.iso8601, uploader: entry.uploader.full_name,
        byte_size: entry.details.dig("file", "byte_size"), content_type: entry.details.dig("file", "content_type") }
    end
end
