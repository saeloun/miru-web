# frozen_string_literal: true

class Payroll::ConsultantInvoiceIssue
  STALE_AFTER = 15.minutes
  class Blocked < StandardError; end

  def initialize(run, employment_id:)
    @run, @employment_id = run, employment_id
  end

  def issue!
    raise ActiveRecord::ActiveRecordError, "Invoice issuance must run after commit" if ApplicationRecord.connection.transaction_open?

    2.times do
      candidate = claim
      return candidate unless candidate.is_a?(Hash)

      staged = nil
      begin
        employment = @run.company.employments.find(@employment_id)
        Payroll::BillingIdentity.new(employment).frozen_binding!(candidate.fetch("billing_receipt"), verify_evidence: true)
        verify_original!(@preparation.original_blob, candidate.fetch("original")) if candidate["mode"] == "existing"
        bytes = Payroll::ConsultantInvoicePdf.new(snapshot: candidate, kind: candidate["mode"] == "existing" ? "paid_settlement" : "invoice").render
        raise "Invalid rendered PDF" unless bytes.start_with?("%PDF-") && bytes.bytesize.between?(1, 5.megabytes)

        staged = ActiveStorage::Blob.create_and_upload!(io: StringIO.new(bytes), filename: "consultant-paid.pdf", content_type: "application/pdf")
        raise "Private invoice storage is required" if staged.service.public?

        candidate["pdf"] = { "sha256" => Digest::SHA256.hexdigest(bytes), "byte_size" => bytes.bytesize }
        verify_original!(staged, candidate.fetch("pdf"))
        result = finish(candidate, staged)
        return result unless result == :date_changed
      rescue StandardError => error
        fail_claim(error.is_a?(ActiveRecord::RecordNotUnique) ? "number_conflict" : "render_unavailable", state: "failed")
        Rails.logger.warn({ event: "consultant_invoice_unavailable", run_id: @run.id, preparation_id: @preparation&.id, error_class: error.class.name }.to_json)
        return @preparation&.reload
      ensure
        staged&.purge unless staged.nil? || PayrollConsultantInvoice.exists?(pdf_blob_id: staged.id)
      end
    end
    fail_claim("issue_date_changed")
    @preparation&.reload
  end

  private

    def invoices
      PayrollConsultantInvoice.where(company_id: @run.company_id, payroll_run: @run, employment_id: @employment_id)
    end

    def locked
      @run.with_lock do
        existing = invoices.first
        next existing if existing

        group = PayrollPaymentGroup.where(company_id: @run.company_id, payroll_run: @run, employment_id: @employment_id).lock.first
        legs = group ? group.payroll_payment_instructions.order(:id).lock.to_a : []
        handoff = PayrollIndiaHandoff.active.where(company_id: @run.company_id, payroll_run: @run, employment_id: @employment_id).lock.first
        employment = @run.company.employments.find(@employment_id)
        employment.with_lock do
          preparation = PayrollInvoicePreparation.heads.where(company_id: @run.company_id, payroll_run: @run, employment:).lock.first
          yield employment, preparation, group, legs, handoff
        end
      end
    end

    def claim
      locked do |employment, preparation, group, legs, handoff|
        @preparation = preparation
        next unless preparation
        next preparation if preparation.state == "failed" || preparation.state == "generating" && preparation.started_at && preparation.started_at > STALE_AFTER.ago

        begin
          snapshot = snapshot!(employment, preparation, group, legs, handoff)
          if snapshot["mode"] == "generate"
            consent = Payroll::InvoiceAuthorization.new(employment).receipt
            raise Blocked, "consent_required" unless consent
            snapshot["authorization_id"] = consent.id
          end
          @claim_token = SecureRandom.hex(32)
          preparation.update!(state: "generating", claim_token: @claim_token, started_at: Time.current, error_code: nil)
          snapshot
        rescue Blocked => error
          preparation.update!(state: error.message == "waiting_credit" ? "waiting_credit" : "blocked", error_code: error.message, next_attempt_at: 5.minutes.from_now)
          preparation
        end
      end
    end

    def finish(candidate, staged)
      locked do |employment, current, group, legs, handoff|
        raise Blocked, "preparation_changed" unless current&.id == @preparation.id && current.claim_token == @claim_token
        fresh = snapshot!(employment, current, group, legs, handoff)
        raise Blocked, "settlement_changed" unless source_digest(fresh) == source_digest(candidate)
        if candidate["mode"] == "generate"
          consent = Payroll::InvoiceAuthorization.new(employment).receipt
          raise Blocked, "consent_changed" unless consent && consent.id == candidate["authorization_id"]
        end
        if candidate["document_on"] != Time.current.in_time_zone("Asia/Kolkata").to_date.iso8601
          current.update!(state: "queued", claim_token: nil, started_at: nil, error_code: "issue_date_changed")
          next :date_changed
        end
        raise Blocked, "number_conflict" if PayrollConsultantInvoice.exists?(company_id: @run.company_id, issuer_id: employment.user_id,
          financial_year: candidate["financial_year"], number_digest: number_digest(candidate))

        invoice = invoices.create!(payroll_revision: current.payroll_revision, preparation: current, issuer_id: employment.user_id,
          authorization_id: candidate["authorization_id"], payroll_payment_group_id: candidate["payment_group_id"],
          payroll_india_handoff_id: candidate["india_handoff_id"], pdf_blob: staged, original_blob: current.original_blob,
          snapshot: candidate, mode: candidate["mode"], financial_year: candidate["financial_year"], number_digest: number_digest(candidate), issued_on: candidate["issued_on"])
        invoice.payroll_consultant_invoice_deliveries.create!(attempt_number: 1)
        current.update!(state: "completed", claim_token: nil, started_at: nil, error_code: nil)
        invoice
      rescue Blocked => error
        fail_claim(error.message)
        @preparation.reload
      end
    end

    def snapshot!(employment, preparation, group, legs, handoff)
      raise Blocked, "payroll_disabled" unless Payroll::Entitlement.enabled?(@run.company_id)
      raise Blocked, "subject_unavailable" unless Employment.kept.exists?(id: employment.id, company_id: @run.company_id, user_id: employment.user_id) && User.kept.exists?(id: employment.user_id)
      raise Blocked, "preparation_review_required" unless preparation.reviewed?
      raise Blocked, "accounts_destination_review_required" unless preparation.facts["accounts_destination_confirmed"] == true && preparation.facts["accounts_email"].is_a?(String) && preparation.facts["accounts_email"].present?
      raise Blocked, "reviewer_unavailable" unless Payroll::ConsultantInvoicePreparation.new(@run, actor: preparation.actor).reviewer?(employment)
      revision = preparation.payroll_revision
      raise Blocked, "revision_changed" unless revision.payroll_run_id == @run.id && revision.digest == preparation.facts["revision_digest"] &&
        PayrollRevision.chain_digest(Payroll::Snapshot.new(@run, revision.payroll_payload).digest, revision.parent_digest, revision.number) == revision.digest &&
        revision.payroll_approvals.where(stage: %w[accounts final]).distinct.count(:stage) == 2

      line = revision.payroll_payload.fetch("lines").find { |entry| entry["employment_id"] == employment.id && entry["pay_type"] == "consultant" }
      raise Blocked, "revision_changed" unless line && Payroll::IndiaHandoff.line_digest(line) == preparation.facts["line_digest"]
      binding = preparation.facts["billing_identity"]
      billing = Payroll::BillingIdentity.new(employment).frozen_binding!(binding)
      terms = employment.consultant_compensations.find(line.fetch("preparation").fetch("terms_id"))
      raise Blocked, "contracting_entity_changed" unless preparation.facts.dig("billed_entity", "name") == terms.legal_entity_name
      open_legs = legs.select { |leg| leg.released_at.nil? }
      raise Blocked, "ambiguous_settlement" if handoff && open_legs.any?
      raise Blocked, "waiting_credit" if PayrollPtoRecovery.heads.exists?(payroll_run: @run, employment:, kind: "returned_review")
      settlements, source = if handoff
        india_facts!(handoff, line)
      elsif group && open_legs.any?
        mercury_facts!(group, open_legs, line)
      else
        raise Blocked, "waiting_credit"
      end
      date = preparation.facts["mode"] == "generate" ? Time.current.in_time_zone("Asia/Kolkata").to_date : Date.iso8601(preparation.facts.fetch("original_date"))
      raise Blocked, "numbering_review_required" unless preparation.facts["financial_year"] == Payroll::ConsultantInvoicePreparation.financial_year(date)
      preparation.facts.slice(*Payroll::ConsultantInvoicePreparation::FIELDS).merge(source).merge(
        "version" => 1, "status" => "Paid", "issued_on" => date.iso8601, "accounts_email" => preparation.facts.fetch("accounts_email"),
        "document_on" => Time.current.in_time_zone("Asia/Kolkata").to_date.iso8601, "preparation_id" => preparation.id,
        "revision_id" => revision.id, "revision_digest" => revision.digest, "billing_receipt" => binding,
        "supplemental_billing" => preparation.facts.fetch("supplemental_billing", false), "consultant" => billing,
        "service_from" => line.dig("preparation", "service_fee_review", "context", "service_from") || @run.period.iso8601,
        "service_to" => line.dig("preparation", "service_fee_review", "context", "service_to") || @run.period.end_of_month.iso8601,
        "currency" => line.fetch("currency"), "amounts" => line.fetch("amounts"), "extras" => line.fetch("extras"),
        "reimbursements" => line.fetch("reimbursements"), "deductions" => line.fetch("deductions"), "settlements" => settlements,
        "original" => preparation.facts["original"], "company_bank_costs" => open_legs.map { |leg| { "instruction_id" => leg.id, "currency" => "USD", "fee_minor" => leg.fee_minor, "charge_type" => leg.charge_type } })
    rescue Payroll::Workflow::Conflict, ActiveRecord::RecordNotFound, KeyError
      raise Blocked, "frozen_source_unavailable", cause: nil
    end

    def mercury_facts!(group, legs, line)
      raise Blocked, "waiting_credit" unless group.fully_credited_at && group.fully_credited? && group.entitlement_minor == line.dig("amounts", "net_minor")
      raise Blocked, "settlement_basis_changed" unless group.line_digest == PayrollPaymentGroup.line_digest(line) && legs.all? do |leg|
        approved = leg.payroll_revision.payroll_payload.fetch("lines").find { |entry| entry["employment_id"] == @employment_id.to_i }
        leg.intact? && leg.company_id == @run.company_id && leg.employment_id == @employment_id.to_i &&
          leg.payroll_run_id == @run.id && approved && Payroll::MercuryRevisionGuard.same_line?(approved, line)
      end
      settlements = legs.map do |leg|
        credits = leg.payroll_payment_events.where(kind: %w[credit_recorded shortfall_resolved]).order(:id).map { |event| { "event_id" => event.id, "kind" => event.kind, "data" => event.data } }
        raise Blocked, "credit_evidence_unavailable" unless credits.select { |entry| entry["kind"] == "credit_recorded" }.sum { |entry| entry.dig("data", "amount_minor") } == leg.credited_minor

        leg.attributes.slice(*%w[id payroll_revision_id beneficiary entitlement_minor entitlement_currency principal_minor reference_rate buffered_rate rate_source provider_request_id provider_transaction_id transaction_status credit_state credited_minor]).merge("currency" => "USD", "credits" => credits)
      end
      [settlements, { "payment_group_id" => group.id, "fully_credited_at" => group.fully_credited_at.iso8601(6) }]
    end

    def india_facts!(handoff, line)
      credits = handoff.payroll_india_credits.order(:id).to_a
      raise Blocked, "waiting_credit" unless handoff.fully_credited_at && !handoff.released_at && handoff.credited_minor >= handoff.entitlement_minor &&
        credits.sum(&:amount_minor) == handoff.credited_minor
      raise Blocked, "settlement_basis_changed" unless handoff.line_digest == Payroll::IndiaHandoff.line_digest(line) && handoff.entitlement_minor == line.dig("amounts", "net_minor")

      [credits.map { |credit| { "id" => credit.id, "currency" => "INR", "credited_minor" => credit.amount_minor, "credited_on" => credit.credited_on.iso8601, "reference" => credit.reference } },
       { "india_handoff_id" => handoff.id, "fully_credited_at" => handoff.fully_credited_at.iso8601(6) }]
    end

    def source_digest(snapshot)
      Payroll::ConsultantInvoicePreparation.digest(snapshot.except("pdf", "authorization_id", "issued_on", "document_on"))
    end

    def number_digest(snapshot)
      Payroll::ConsultantInvoicePreparation.number_digest(snapshot)
    end

    def verify_original!(blob, descriptor)
      raise "Private original is unavailable" unless blob && !blob.service.public?
      digest = Digest::SHA256.new
      size = 0
      blob.download do |chunk|
        size += chunk.bytesize
        raise "PDF length changed" if size > descriptor.fetch("byte_size")
        digest.update(chunk)
      end
      raise "PDF hash changed" unless size == descriptor.fetch("byte_size") && digest.hexdigest == descriptor.fetch("sha256")
    end

    def fail_claim(code, state: "blocked")
      return unless @preparation && @claim_token

      PayrollInvoicePreparation.where(id: @preparation.id, claim_token: @claim_token).update_all(state:, claim_token: nil, started_at: nil, error_code: code, next_attempt_at: 5.minutes.from_now, updated_at: Time.current)
    end
end
