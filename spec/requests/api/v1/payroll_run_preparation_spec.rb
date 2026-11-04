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
    2.times do
      post "/api/v1/payroll_runs/#{created_run.id}/revisions", params:, as: :json
      expect(response).to have_http_status(201)
    end
    expect(created_run.payroll_revisions.count).to eq(1)
  end

  it "carries Sonam's confirmed unpaid example from actual hours through approvals and INR credit" do
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 100_000,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us", legal_entity_name: legal_name, change_reason: "Agreed monthly fee")
    calendar = create(:holiday, company:, year: 2026)
    create(:holiday_info, holiday: calendar, date: Date.new(2026, 11, 12), category: :national)
    [3, 4, 5, 6, 9, 10, 11, 13, 16, 17, 18].each do |day|
      create(:timesheet_entry, user: worker, project: work_entry.project, work_date: Date.new(2026, 11, day), duration: 480)
    end
    create(:timesheet_entry, user: worker, project: work_entry.project, work_date: Date.new(2026, 11, 19), duration: 240)

    sign_in owner
    create_run
    expect(response).to have_http_status(201)
    id = created_run.id

    sign_in accounts
    get "/api/v1/payroll_runs/#{id}/preparation", as: :json
    expect(response).to have_http_status(200)
    row = json_response.fetch("consultants").find { |consultant| consultant["employment_id"] == employment.id }
    expect(row).to include("monthly_fee" => "100000.0", "expected_hours" => "160.0", "recorded_hours" => "100.0", "fee_estimate" => "100000.0")
    post "/api/v1/payroll_runs/#{id}/revisions", params: { company_id: company.id, cutoff: "2026-12-05", idempotency_key: "sonam-unpaid-example",
      consultants: [{ employment_id: employment.id, confirmed_unpaid_hours: "60", unpaid_reason: "Confirmed unpaid leave", acknowledged: true }] }, as: :json
    expect(response).to have_http_status(201)
    revision = created_run.current_revision
    line = revision.payroll_payload.fetch("lines").sole
    expect(line.fetch("calculation_snapshot").fetch("input")).to include("paid_quantity" => "100.0", "basis_quantity" => "160.0")
    expect(line.fetch("amounts")).to include("base_minor" => 6_250_000, "net_minor" => 6_250_000)

    post "/api/v1/payroll_runs/#{id}/approvals", params: { company_id: company.id, stage: "accounts", expected_digest: revision.digest }, as: :json
    expect(json_response["status"]).to eq("accounts_approved")
    sign_in owner
    post "/api/v1/payroll_runs/#{id}/approvals", params: { company_id: company.id, stage: "final", expected_digest: revision.digest }, as: :json
    expect(json_response["status"]).to eq("approved")
    expect(revision.payroll_approvals.pluck(:stage, :actor_id)).to contain_exactly(["accounts", accounts.id], ["final", owner.id])

    verified_connection
    linked_recipient
    payments = Payroll::MercuryPayment.new(created_run)
    instruction = payments.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:).sole
    expect(instruction.entitlement_minor).to eq(6_250_000)
    write = stub_mercury_write
    payments.submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
    expect do
      payments.submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
    end.to raise_error(Payroll::MercuryPayment::Blocked) { |error| expect(error.codes).to include("already_submitted") }
    expect(write).to have_been_requested.once

    stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}")
      .to_return(mercury_json(mercury_request("status" => "approved")))
    stub_request(:get, %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions})
      .to_return(mercury_json({ "total" => 1, "transactions" => [mercury_transaction("status" => "sent")] }))
    reconciliation = Payroll::MercuryReconciliation.new(created_run)
    sent = reconciliation.refresh!(actor: owner, instruction_id: instruction.id)
    expect(sent.display_state).to eq("sent_awaiting_credit")
    expect(sent.credited_minor).to eq(0)
    expect(sent.payroll_payment_group.fully_credited_at).to be_nil

    2.times do
      reconciliation.record_credit!(actor: accounts, instruction_id: instruction.id, amount: "62500.00", credited_on: "2026-12-05", reference: "SYNTHETIC-INR-CREDIT")
    end
    expect(instruction.reload.display_state).to eq("credited")
    expect(instruction.credited_minor).to eq(6_250_000)
    expect(instruction.payroll_payment_group.reload.fully_credited_at).to be_present
    expect(instruction.payroll_payment_events.where(kind: "credit_recorded").count).to eq(1)
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
