# frozen_string_literal: true

class Payroll::ConsultantInvoiceDelivery
  STALE_AFTER = 15.minutes

  def initialize(delivery)
    @delivery = delivery
    @invoice = delivery.payroll_consultant_invoice
    @run = @invoice.payroll_run
  end

  def self.recipient(invoice)
    preparation = invoice.preparation
    snapshot = invoice.snapshot
    address = snapshot["accounts_email"]
    unless preparation.reviewed? && preparation.facts["accounts_destination_confirmed"] == true &&
        snapshot["accounts_destination_confirmed"] == true && address.is_a?(String) &&
        address == preparation.facts["accounts_email"] && address.length <= 254 &&
        address.match?(/\A[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\z/)
      raise Payroll::Workflow::Conflict, "Reviewed accounts destination is unavailable"
    end
    address
  end

  def self.pdf_bytes(invoice, kind:)
    identity!(invoice)
    if kind.to_s == "paid"
      blob, descriptor = invoice.pdf_blob, invoice.snapshot["pdf"]
    elsif kind.to_s == "original" && invoice.mode == "existing"
      blob, descriptor = invoice.original_blob, invoice.snapshot["original"]
    end
    blob_bytes(blob, descriptor)
  end

  def self.preparation_original_bytes(preparation)
    unless preparation.facts["mode"] == "existing" && preparation.payroll_run.company_id == preparation.company_id &&
        preparation.employment.company_id == preparation.company_id && preparation.payroll_revision.payroll_run_id == preparation.payroll_run_id &&
        preparation.payroll_revision.digest == preparation.facts["revision_digest"]
      raise Payroll::Workflow::Conflict, "Original preparation identity changed"
    end
    blob_bytes(preparation.original_blob, preparation.facts["original"])
  end

  def self.blob_bytes(blob, descriptor)
    byte_size = descriptor["byte_size"] if descriptor.is_a?(Hash)
    unless blob && !blob.service.public? && descriptor.is_a?(Hash) &&
        byte_size.is_a?(Integer) && byte_size.between?(1, 5.megabytes) &&
        descriptor["sha256"].is_a?(String) && descriptor["sha256"].match?(/\A[0-9a-f]{64}\z/) && blob.byte_size == byte_size
      raise Payroll::Workflow::Conflict, "Private invoice PDF is unavailable"
    end
    bytes = +"".b
    blob.download do |chunk|
      bytes << chunk
      raise Payroll::Workflow::Conflict, "Invoice PDF length changed" if bytes.bytesize > byte_size
    end
    unless bytes.bytesize == byte_size && Digest::SHA256.hexdigest(bytes) == descriptor["sha256"]
      raise Payroll::Workflow::Conflict, "Invoice PDF bytes changed"
    end
    bytes
  end
  private_class_method :blob_bytes

  def self.credit_review?(invoice)
    identity!(invoice)
    return true if PayrollPtoRecovery.heads.exists?(company_id: invoice.company_id, payroll_run_id: invoice.payroll_run_id,
      employment_id: invoice.employment_id, kind: "returned_review")

    source = invoice.payroll_payment_group&.reload || invoice.payroll_india_handoff&.reload
    return true unless source && [source.company_id, source.payroll_run_id, source.employment_id] == [invoice.company_id, invoice.payroll_run_id, invoice.employment_id] &&
      source.entitlement_minor == invoice.snapshot.dig("amounts", "net_minor") && source.fully_credited_at

    if source.is_a?(PayrollPaymentGroup)
      !source.fully_credited?
    else
      source.released_at.present? || source.credited_minor < source.entitlement_minor || source.payroll_india_credits.sum(:amount_minor) != source.credited_minor
    end
  end

  def self.identity!(invoice)
    preparation = invoice.preparation
    unless [preparation.company_id, preparation.payroll_run_id, preparation.employment_id, preparation.payroll_revision_id] ==
        [invoice.company_id, invoice.payroll_run_id, invoice.employment_id, invoice.payroll_revision_id] &&
        invoice.payroll_run.company_id == invoice.company_id && invoice.payroll_revision.payroll_run_id == invoice.payroll_run_id &&
        invoice.employment.company_id == invoice.company_id && invoice.employment.user_id == invoice.issuer_id &&
        (invoice.mode != "existing" || invoice.original_blob_id == preparation.original_blob_id)
      raise Payroll::Workflow::Conflict, "Invoice source identity changed"
    end
  end
  private_class_method :identity!

  def deliver
    raise ActiveRecord::ActiveRecordError, "Invoice delivery must run after commit" if ApplicationRecord.connection.transaction_open?

    claimed = locked do
      if stale_sending?
        @delivery.update!(state: "uncertain", claim_token: nil, error_code: "interrupted")
      end
      next false unless @delivery.state == "queued" && permitted_to_send?

      @claim_token = SecureRandom.hex(32)
      @delivery.update!(state: "sending", claim_token: @claim_token, started_at: Time.current, error_code: nil)
      true
    end
    send_invoice if claimed
    @delivery.reload
  end

  def reconcile!(actor:, outcome:, evidence:)
    values = evidence.is_a?(Hash) && evidence.stringify_keys
    unless values && values.keys.sort == %w[reference worker_stopped] && values["worker_stopped"] == true &&
        values["reference"].is_a?(String) && values["reference"].strip.length.between?(1, 200) && !values["reference"].match?(/[\r\n\x00]/) &&
        %w[delivered not_delivered].include?(outcome)
      raise Payroll::Workflow::Conflict, "Confirm stopped worker and delivery evidence"
    end
    locked do
      authorize!(actor)
      latest!
      raise Payroll::Workflow::Conflict, "Delivery is not uncertain" unless @delivery.state == "uncertain" || stale_sending?

      sent = outcome == "delivered"
      @delivery.update!(state: sent ? "sent" : "failed", claim_token: nil, sent_at: sent ? Time.current : nil,
        error_code: sent ? nil : "delivery_confirmed_absent", reconciled_by: actor, reconciled_at: Time.current,
        reconciliation_evidence: JSON.generate(values.merge("reference" => values["reference"].strip)))
    end
    @delivery
  end

  def retry!(actor:, expected_attempt_id:)
    locked do
      authorize!(actor)
      latest!
      unless @delivery.id.to_s == expected_attempt_id.to_s && @delivery.state == "failed"
        raise Payroll::Workflow::Conflict, "Reload the last confirmed failed delivery"
      end
      self.class.recipient(@invoice)
      @invoice.payroll_consultant_invoice_deliveries.create!(attempt_number: @delivery.attempt_number + 1,
        reviewed_by: actor, reviewed_at: Time.current, review_evidence: "Explicit retry of confirmed failed attempt #{@delivery.id}")
    end
  end

  private

    def locked(&block)
      @run.with_lock do
        @invoice.employment.with_lock do
          @invoice.with_lock { @delivery.with_lock(&block) }
        end
      end
    end

    def stale_sending?
      @delivery.state == "sending" && (!@delivery.started_at || @delivery.started_at <= STALE_AFTER.ago)
    end

    def latest!
      raise Payroll::Workflow::Conflict, "Delivery attempt changed" unless @invoice.payroll_consultant_invoice_deliveries.maximum(:attempt_number) == @delivery.attempt_number
    end

    def authorize!(actor)
      unless Payroll::ConsultantInvoicePreparation.new(@run, actor:).reviewer?(@invoice.employment)
        raise Payroll::Workflow::NotAuthorized, "A current nonself invoice reviewer is required"
      end
    end

    def permitted_to_send?
      self.class.send(:identity!, @invoice)
      self.class.recipient(@invoice)
      actor = User.find_by(id: @delivery.reviewed_by_id || @invoice.preparation.actor_id)
      authorize!(actor)
      unless Employment.kept.exists?(id: @invoice.employment_id, company_id: @invoice.company_id) && User.kept.exists?(id: @invoice.issuer_id)
        raise Payroll::Workflow::Conflict, "Invoice subject is unavailable"
      end
      raise Payroll::Workflow::Conflict, "Invoice credit is under review" if self.class.credit_review?(@invoice)

      true
    rescue Payroll::Workflow::NotAuthorized, Payroll::Workflow::Conflict, ActiveRecord::RecordNotFound
      @delivery.update!(state: "failed", claim_token: nil, error_code: "source_review_required")
      false
    end

    def send_invoice
      begin
        mail = PayrollConsultantInvoiceMailer.invoice(@delivery.id)
        message = mail.message
      rescue StandardError => error
        Rails.logger.warn({ event: "consultant_invoice_attachment_unavailable", invoice_id: @invoice.id, delivery_id: @delivery.id, error_class: error.class.name }.to_json)
        record_outcome(state: "failed", error_code: "attachment_unavailable")
        return
      end
      unless message.perform_deliveries
        record_outcome(state: "failed", error_code: "delivery_disabled")
        return
      end
      message.raise_delivery_errors = true
      return unless ready_for_transport?(message)

      begin
        mail.deliver_now
      rescue Postmark::InactiveRecipientError
        record_outcome(state: "failed", error_code: "transport_rejected")
      rescue StandardError
        record_outcome(state: "uncertain", error_code: "transport_unknown")
      else
        record_outcome(state: "sent", sent_at: Time.current, error_code: nil)
      end
    end

    def ready_for_transport?(message)
      locked do
        next false unless claimed?
        if stale_sending?
          @delivery.update!(state: "failed", claim_token: nil, error_code: "claim_expired")
          next false
        end
        next false unless permitted_to_send?

        recipient = self.class.recipient(@invoice)
        unless message.to == [recipient] && message.cc.blank? && message.bcc.blank?
          @delivery.update!(state: "failed", claim_token: nil, error_code: "recipient_changed")
          next false
        end
        @delivery.update!(started_at: Time.current)
        true
      end
    end

    def claimed?
      @delivery.state == "sending" && @delivery.claim_token == @claim_token
    end

    def record_outcome(**attributes)
      locked { @delivery.update!(**attributes, claim_token: nil) if claimed? }
    end
end
