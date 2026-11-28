# frozen_string_literal: true

RSpec.shared_context "committed consultant invoice" do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :truncation
    DatabaseCleaner.start
  end
  include_context "approved mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }
  let(:invoice_funding) { "mercury_us" }
  before do
    if invoice_funding == "india"
      ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 62_500,
        hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: legal_name, change_reason: "Synthetic India funding, independent contracting entity")
    end
    configure_synthetic_pto_policy
    record_synthetic_pto_treatment
  end
  let(:revision) { approve_revision }
  let(:invoice_facts) do
    { "mode" => "generate", "billed_entity" => { "name" => legal_name, "address" => "1 Fictional Street, US", "country" => "US", "tax_identifier" => "", "tax_reason" => "Synthetic not applicable" },
      "document_kind" => "consultant_invoice", "treatment" => "manual_reviewed", "treatment_reason" => "Synthetic non-statutory review fixture",
      "timing" => "post_credit_supported", "financial_year" => "2026-2027", "series" => "SYN", "number" => "1",
      "existing_invoice_considered" => true, "accounts_destination_confirmed" => true, "tax_lines" => [] }
  end

  def prepare_consultant_invoice(facts: invoice_facts, original_pdf: nil)
    Payroll::ConsultantInvoicePreparation.new(run, actor: accounts).record!(employment_id: employment.id, facts:,
      expected_revision_digest: revision.digest, expected_preparation_id: "", idempotency_key: "invoice-preparation", original_pdf:)
  end

  def grant_invoice_consent
    worker.update!(current_workspace: company)
    consent = Payroll::InvoiceAuthorization.new(employment, actor: worker)
    consent.record!(action: "grant", expected_event_id: "", statement_digest: consent.summary.dig(:statement, :digest), idempotency_key: "invoice-consent")
    consent
  end

  def credit_invoice_leg(leg)
    leg.update!(transaction_status: "sent", transaction_link_state: "linked", provider_transaction_id: SecureRandom.uuid)
    Payroll::MercuryReconciliation.new(run).record_credit!(actor: accounts, instruction_id: leg.id,
      amount: format("%.2f", leg.entitlement_minor / 100.0), credited_on: "2026-12-05", reference: "Synthetic credit #{leg.id}")
  end

  def credited_invoice_leg
    leg = prepared_instruction(revision:)
    stub_mercury_reads
    stub_mercury_write(mercury_json(mercury_request("status" => "approved", "amount" => leg.principal_minor / 100.0)))
    Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: leg.id, expected_digest: leg.frozen_digest)
    credit_invoice_leg(leg)
    leg
  end
end
