# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payroll run preparation API", type: :request do
  include_context "approved mercury consultant payroll"

  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }

  before { employment.update!(joined_at: Date.new(2020, 1, 1)) }

  let(:run) { nil }

  def created_run
    PayrollRun.find_by!(company:, period: Date.new(2026, 11, 1))
  end

  def create_run(reviewer: accounts, approver: owner)
    post "/api/v1/payroll_runs", params: { company_id: company.id, month: "2026-11", accounts_reviewer_id: reviewer.id, final_reviewer_id: approver.id }, as: :json
  end

  it "walks accounts preparation through both approvals from the API" do
    sign_in owner
    get "/api/v1/payroll_runs", as: :json
    options = json_response.fetch("preparation")
    expect(options["can_create"]).to be(true)
    expect(options["accounts_reviewers"].pluck("id")).to include(accounts.id.to_s)
    expect(options["final_reviewers"].pluck("id")).to eq([owner.id.to_s])

    create_run
    expect(response).to have_http_status(201)
    expect(created_run.dry_run).to be(true)
    id = created_run.id

    sign_in accounts
    get "/api/v1/payroll_runs/#{id}/preparation", as: :json
    expect(response).to have_http_status(200)
    row = json_response["consultants"].first
    expect(row["ready"]).to be(true)
    post "/api/v1/payroll_runs/#{id}/revisions", params: { company_id: company.id, cutoff: "2026-12-05", idempotency_key: "first",
                                                          consultants: [{ employment_id: employment.id, acknowledged: true }] }, as: :json
    expect(response).to have_http_status(201)
    digest = json_response.dig("revision", "digest")

    post "/api/v1/payroll_runs/#{id}/approvals", params: { company_id: company.id, stage: "accounts", expected_digest: digest }, as: :json
    expect(json_response["status"]).to eq("accounts_approved")

    sign_in owner
    post "/api/v1/payroll_runs/#{id}/approvals", params: { company_id: company.id, stage: "final", expected_digest: digest }, as: :json
    expect(json_response["status"]).to eq("approved")
  end

  it "is idempotent for a repeated revision submission" do
    sign_in owner
    create_run
    sign_in accounts
    params = { company_id: company.id, cutoff: "2026-12-05", idempotency_key: "same", consultants: [{ employment_id: employment.id, acknowledged: true }] }
    post "/api/v1/payroll_runs/#{created_run.id}/revisions", params:, as: :json
    expect(response).to have_http_status(201)
    expect(created_run.payroll_revisions.count).to eq(1)
  end

  it "does not allow one person to review as both accounts and owner" do
    sign_in owner
    create_run(reviewer: owner, approver: owner)
    expect(response).to have_http_status(422)
  end

  it "does not let a bookkeeper or employee create runs" do
    sign_in accounts
    create_run
    expect(response).to have_http_status(403)
  end

  it "refuses a future month" do
    sign_in owner
    post "/api/v1/payroll_runs", params: { company_id: company.id, month: "2027-05", accounts_reviewer_id: accounts.id, final_reviewer_id: owner.id }, as: :json
    expect(response).to have_http_status(422)
  end

  it "refuses a duplicate month" do
    sign_in owner
    create_run
    create_run
    expect(response).to have_http_status(422).or have_http_status(409)
    expect(PayrollRun.where(company:).count).to eq(1)
  end

  it "only lets the assigned accounts reviewer save a revision" do
    sign_in owner
    create_run
    post "/api/v1/payroll_runs/#{created_run.id}/revisions", params: { company_id: company.id, cutoff: "2026-12-05", idempotency_key: "x",
                                                                      consultants: [{ employment_id: employment.id, acknowledged: true }] }, as: :json
    expect(response).to have_http_status(403)
  end

  it "does not let the wrong person approve a stage" do
    sign_in owner
    create_run
    sign_in accounts
    post "/api/v1/payroll_runs/#{created_run.id}/revisions", params: { company_id: company.id, cutoff: "2026-12-05", idempotency_key: "a",
                                                                      consultants: [{ employment_id: employment.id, acknowledged: true }] }, as: :json
    digest = json_response.dig("revision", "digest")
    post "/api/v1/payroll_runs/#{created_run.id}/approvals", params: { company_id: company.id, stage: "final", expected_digest: digest }, as: :json
    expect(response).to have_http_status(422)
    expect(created_run.current_revision.payroll_approvals).to be_empty
  end

  it "refuses a stale digest on approval" do
    sign_in owner
    create_run
    sign_in accounts
    post "/api/v1/payroll_runs/#{created_run.id}/revisions", params: { company_id: company.id, cutoff: "2026-12-05", idempotency_key: "a",
                                                                      consultants: [{ employment_id: employment.id, acknowledged: true }] }, as: :json
    post "/api/v1/payroll_runs/#{created_run.id}/approvals", params: { company_id: company.id, stage: "accounts", expected_digest: "0" * 64 }, as: :json
    expect(response).to have_http_status(409)
  end
end
