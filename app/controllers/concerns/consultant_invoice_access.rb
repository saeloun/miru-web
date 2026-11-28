# frozen_string_literal: true

module ConsultantInvoiceAccess
  private

    # These private routes also require the explicit workspace on GETs, including
    # retained history when the payroll feature is no longer enabled.
    def verify_payroll_workspace
      value = params[:company_id]
      return if (value.is_a?(String) || value.is_a?(Integer)) && current_company && value.to_s == current_company.id.to_s &&
        current_user.current_workspace_id == current_company.id

      skip_authorization
      render json: { errors: "Invoice workspace changed; reload the current workspace" }, status: 409
    end

    def invoice_id!(value)
      unless (value.is_a?(String) || value.is_a?(Integer)) && value.to_s.match?(/\A[1-9]\d{0,18}\z/) && value.to_i <= 9_223_372_036_854_775_807
        raise Payroll::ConsultantReview::InvalidInput, "Use an exact invoice record"
      end
      value.to_i
    end

    def invoice_input!(key, allowed)
      input = params.require(key)
      unless input.is_a?(ActionController::Parameters) && (input.keys - allowed).empty? && (allowed - %w[original_pdf]).all? { |field| input.key?(field) }
        raise Payroll::ConsultantReview::InvalidInput, "Provide only the named invoice fields"
      end
      input
    end

    def invoice_facts!(value)
      value = JSON.parse(value) if value.is_a?(String) && value.bytesize <= 32.kilobytes
      value = value.to_unsafe_h if value.is_a?(ActionController::Parameters)
      raise Payroll::ConsultantReview::InvalidInput, "Provide named invoice facts" unless value.is_a?(Hash)

      value
    rescue JSON::ParserError
      raise Payroll::ConsultantReview::InvalidInput, "Provide named invoice facts"
    end

    def invoice_boolean!(value)
      return true if value == true || value == "true"
      return false if value == false || value == "false"

      raise Payroll::ConsultantReview::InvalidInput, "Choose an explicit invoice review action"
    end

    def invoice_context(run, employment)
      PayrollConsultantInvoice.new(company: run.company, payroll_run: run, employment:)
    end

    def invoice_policy(record)
      PayrollConsultantInvoicePolicy.new(current_user, record)
    end

    def preparation_details(preparation)
      return unless preparation

      { id: preparation.id.to_s, reviewed: preparation.reviewed?, state: preparation.state, error_code: preparation.error_code,
        created_at: preparation.created_at.iso8601, expected_revision_digest: preparation.facts["revision_digest"],
        facts: preparation.facts.slice(*Payroll::ConsultantInvoicePreparation::FIELDS, "original_date", "supplemental_billing_binding"),
        original_available: preparation.original_blob_id.present?, accounts_email: preparation.facts["accounts_email"] }
    end

    def invoice_details(invoice)
      attempt = invoice.payroll_consultant_invoice_deliveries.order(attempt_number: :desc).first
      snapshot = invoice.snapshot
      { id: invoice.id.to_s, employment_id: invoice.employment_id.to_s, payroll_run_id: invoice.payroll_run_id.to_s,
        consultant_name: snapshot.dig("consultant", "legal_name"), number: Payroll::ConsultantInvoicePreparation.invoice_number(snapshot),
        issued_on: invoice.issued_on.iso8601, document_on: snapshot["document_on"], service_from: snapshot["service_from"], service_to: snapshot["service_to"],
        mode: invoice.mode, status: "Paid", credit_under_review: Payroll::ConsultantInvoiceDelivery.credit_review?(invoice),
        accounts_email: snapshot["accounts_email"], original_available: invoice.original_blob_id.present?,
        email: attempt && { id: attempt.id.to_s, state: attempt.state, error_code: attempt.error_code, sent_at: attempt.sent_at&.iso8601 } }
    end

    def stream_invoice(invoice)
      kind = params[:kind] || "paid"
      raise ActiveRecord::RecordNotFound unless %w[paid original].include?(kind)
      authorize invoice, :download?, policy_class: PayrollConsultantInvoicePolicy
      bytes = Payroll::ConsultantInvoiceDelivery.pdf_bytes(invoice, kind:)
      blob_id = kind == "paid" ? invoice.pdf_blob_id : invoice.original_blob_id
      with_download_workspace do
        fresh = invoice_scope.find(invoice.id)
        authorize fresh, :download?, policy_class: PayrollConsultantInvoicePolicy
        raise ActiveRecord::RecordNotFound unless (kind == "paid" ? fresh.pdf_blob_id : fresh.original_blob_id) == blob_id

        response.headers["X-Content-Type-Options"] = "nosniff"
        send_data bytes, type: "application/pdf", filename: "consultant-invoice-#{invoice.id}-#{kind}.pdf", disposition: "attachment"
      end
    end

    def stream_preparation_original(preparation)
      context = invoice_context(preparation.payroll_run, preparation.employment)
      authorize context, :show?, policy_class: PayrollConsultantInvoicePolicy
      bytes = Payroll::ConsultantInvoiceDelivery.preparation_original_bytes(preparation)
      blob_id = preparation.original_blob_id
      with_download_workspace do
        fresh = preparation_scope.find(preparation.id)
        authorize invoice_context(fresh.payroll_run, fresh.employment), :show?, policy_class: PayrollConsultantInvoicePolicy
        raise ActiveRecord::RecordNotFound unless fresh.original_blob_id == blob_id

        response.headers["X-Content-Type-Options"] = "nosniff"
        send_data bytes, type: "application/pdf", filename: "consultant-original-#{preparation.id}.pdf", disposition: "attachment"
      end
    end
end
