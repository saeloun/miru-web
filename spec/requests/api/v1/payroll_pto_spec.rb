# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Approved payroll PTO", type: :request do
  include_context "approved mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }
  before { employment.update!(joined_at: Date.new(2020, 1, 1)) }

  let(:path) { "/api/v1/payroll_pto/#{employment.id}" }
  let(:configuration) do
    { effective_on: "2026-11-01", opening_on: "2026-11-01", opening_hours: "40", monthly_accrual_hours: "0",
      accrual_day: "1", leave_year_month: "4", leave_year_day: "1", carry_rule: "review", rate_basis: "origin_period_fee",
      advance_limit_hours: "80", exception_threshold_hours: "8", negative_threshold_hours: "8",
      evidence: "synthetic-approved-policy", reason: "Synthetic reconciled opening", idempotency_key: "synthetic-policy" }
  end

  it "requires an explicit workspace and owner policy, serves private facts without GET writes, and rejects forged quantities" do
    sign_in owner
    post "#{path}/policy", params: { company_id: company.id, pto_policy: configuration }
    expect(response).to have_http_status(201)
    expect do
      get path, params: { company_id: company.id, month: "2026-11" }
    end.not_to change(PayrollPtoEntry, :count)
    expect(response).to have_http_status(200)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    facts = response.parsed_body.fetch("facts")
    post "#{path}/decisions", params: { company_id: company.id, pto_decision: {
      period: "2026-11-01", kind: "unpaid", reason: "Synthetic explicit unpaid", hours: "1",
      expected_digest: facts.fetch("digest"), idempotency_key: "forged-hours"
    } }
    expect(response).to have_http_status(422)
    expect(PayrollPtoEntry.where(kind: "unpaid")).to be_empty
    post "#{path}/decisions", params: { company_id: company.id, pto_decision: {
      period: "2026-11-01", kind: "defer", reason: "Synthetic explicit full-pay defer",
      expected_digest: facts.fetch("digest"), idempotency_key: "explicit-defer"
    } }
    expect(response).to have_http_status(201)
    post "#{path}/decisions", params: { pto_decision: { kind: "waive" } }
    expect(response).to have_http_status(409)
  end

  it "denies employees, cross-workspace records and accounts approval of a PTO treatment" do
    sign_in accounts
    post "#{path}/policy", params: { company_id: company.id, pto_policy: configuration }
    expect(response).to have_http_status(403)
    get path, params: { company_id: company.id, month: "2026-11" }
    expect(response).to have_http_status(403)
    run
    get path, params: { company_id: company.id, month: "2026-11" }
    expect(response).to have_http_status(200)
    get "/api/v1/payroll_pto/report", params: { company_id: company.id, as_of: "2026-11-30" }
    expect(response).to have_http_status(403)
    sign_in worker
    worker.update!(current_workspace: company)
    worker.add_role(:employee, company)
    get path, params: { company_id: company.id, month: "2026-11" }
    expect(response).to have_http_status(403)
    sign_in owner
    foreign = create(:employment)
    get "/api/v1/payroll_pto/#{foreign.id}", params: { company_id: company.id, month: "2026-11" }
    expect(response).to have_http_status(404)
    expect(ConsultantPtoPolicy.count).to eq(0)
  end
end
