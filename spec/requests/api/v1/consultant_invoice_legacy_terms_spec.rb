# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant invoices with legacy unfrozen terms", type: :request do
  self.use_transactional_tests = false
  include_context "committed consultant invoice"
  let!(:employment) { create(:employment, company:, user: worker, joined_at: "2020-01-01", resigned_at: nil) }
  let(:legacy_terms) { {} }

  before do
    worker.update!(current_workspace: company)
    worker.add_role(:employee, company)
    sign_in accounts
  end

  def legacy_run
    @legacy_run ||= begin
      candidate = PayrollRun.create!(company:, period: Date.new(2026, 12, 1), currency: "INR",
        accounts_reviewer: accounts, final_reviewer: owner)
      create(:timesheet_entry, user: worker, project: work_entry.project, work_date: Date.new(2026, 12, 2),
        duration: 480, review_status: :approved)
      record_synthetic_pto_treatment(period: candidate.period)
      current = Payroll::ConsultantRevision.new(candidate, actor: accounts).create!(
        consultants: [{ employment_id: employment.id, expense_ids: [], acknowledged: true }],
        cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "legacy-source")
      payload = current.payroll_payload.deep_dup
      payload.fetch("lines").sole["preparation"] = payload.fetch("lines").sole.fetch("preparation").slice("billing_identity").merge(legacy_terms)
      flow = Payroll::Workflow.new(candidate)
      legacy = flow.revise!(actor: accounts, payload:, idempotency_key: "legacy-billing-only", expected_digest: current.digest)
      flow.approve!(actor: accounts, stage: "accounts", expected_digest: legacy.digest)
      flow.approve!(actor: owner, stage: "final", expected_digest: legacy.digest)
      expect(flow.status).to eq("approved")
      expect(legacy.payroll_approvals.pluck(:actor_id).uniq.size).to eq(2)
      candidate
    end
  end

  it "lists an actually approved billing-only run without inventing current contracting terms" do
    get "/api/v1/payroll_runs/#{legacy_run.id}/consultant_invoices", params: { company_id: company.id }

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("consultant_invoices", "consultants")).to eq([])
  end

  it "keeps a separate retained issued invoice downloadable when legacy availability has no frozen terms" do
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    bytes = invoice.pdf_blob.download
    legacy_run
    sign_in worker

    get "/api/v1/consultant_invoices", params: { company_id: company.id }

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("invoices").pluck("id")).to include(invoice.id.to_s)
    expect(response.parsed_body.fetch("available_runs").pluck("id")).not_to include(legacy_run.id.to_s)
    get "/api/v1/consultant_invoices/#{invoice.id}/download", params: { company_id: company.id, kind: "paid" }
    expect(response).to have_http_status(:ok)
    expect(response.body.b).to eq(bytes)
  end

  it "rejects direct invoice preparation for an approved line without frozen terms" do
    expect do
      post "/api/v1/payroll_runs/#{legacy_run.id}/consultant_invoices/preparations", params: {
        company_id: company.id, invoice_preparation: { employment_id: employment.id, facts: invoice_facts,
          expected_revision_digest: legacy_run.current_revision.digest, expected_preparation_id: "",
          idempotency_key: "legacy-invoice", reviewed: true }
      }, as: :json
    end.not_to change(PayrollInvoicePreparation, :count)

    expect(response).to have_http_status(:unprocessable_content)
    expect(PayrollConsultantInvoice.count).to eq(0)
  end

  context "with an explicit nil frozen terms ID" do
    let(:legacy_terms) do
      { "cutoff" => "2026-12-05", "confirmed_unpaid_hours" => "0", "unpaid_reason" => nil, "terms_id" => nil }
    end

    it "keeps both indexes available without substituting mutable current terms" do
      get "/api/v1/payroll_runs/#{legacy_run.id}/consultant_invoices", params: { company_id: company.id }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("consultant_invoices", "consultants")).to eq([])
      sign_in worker
      get "/api/v1/consultant_invoices", params: { company_id: company.id }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.fetch("available_runs")).to be_empty
    end
  end
end
