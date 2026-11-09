# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant invoice authorization", type: :request do
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }
  let(:company) { create(:company, base_currency: "INR") }
  let(:owner) { create(:user, current_workspace: company) }
  let(:consultant) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: consultant, joined_at: Date.new(2026, 11, 1), resigned_at: nil) }
  let(:path) { "/api/v1/consultant_invoice_authorization" }

  before do
    enable_synthetic_payroll(company.id)
    create(:employment, company:, user: owner, joined_at: Date.new(2020, 1, 1), resigned_at: nil)
    owner.add_role(:owner, company)
    consultant.add_role(:employee, company)
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 50_000,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Synthetic India entity", change_reason: "Synthetic consultant terms")
    sign_in consultant
  end

  def summary(**params)
    get path, params: { company_id: company.id, user_id: consultant.id }.merge(params)
    expect(response).to have_http_status(:ok)
    response.parsed_body.fetch("invoice_authorization")
  end

  def command(facts, action: "grant", key: SecureRandom.uuid)
    { action:, expected_event_id: facts.dig("current_event", "id").to_s,
      statement_digest: facts.fetch("statement").fetch("digest"), idempotency_key: key }
  end

  def save(input, **identity)
    post path, params: { company_id: company.id, user_id: consultant.id, invoice_authorization: input }.merge(identity), as: :json
  end

  it "returns private empty status before any explicit grant" do
    facts = summary
    expect(facts).to include("company_id" => company.id, "employment_id" => employment.id, "user_id" => consultant.id, "consultant_name" => consultant.full_name,
      "status" => "not_granted", "can_grant" => true, "can_withdraw" => false, "history" => [])
    expect(facts.dig("statement", "text")).to include("I authorize Miru", "withdraw")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
  end

  it "records grant and withdrawal, while replay of the old grant preserves withdrawn status" do
    input = command(summary)
    save(input)
    expect(response).to have_http_status(:created)
    receipt = response.parsed_body.dig("invoice_authorization", "current_event", "id")
    withdrawal = command(summary, action: "withdraw")
    save(withdrawal)
    expect(response).to have_http_status(:created)
    expect(summary.fetch("status")).to eq("withdrawn")
    expect do
      save(input)
      expect(response).to have_http_status(:created)
      data = response.parsed_body.fetch("invoice_authorization")
      expect(data.fetch("status")).to eq("withdrawn")
      expect(data.fetch("recorded_event")).to include("id" => receipt, "current" => false)
    end.not_to change(ConsultantInvoiceAuthorization, :count)
    expect do
      save(withdrawal)
      expect(response).to have_http_status(:created)
      expect(response.parsed_body.dig("invoice_authorization", "status")).to eq("withdrawn")
    end.not_to change(ConsultantInvoiceAuthorization, :count)
  end

  it "allows owner read access without granting proxy consent and excludes unrelated staff" do
    facts = summary
    sign_in owner
    expect(summary).to include("can_grant" => false, "can_withdraw" => false)
    save(command(facts))
    expect(response).to have_http_status(:forbidden)
    stranger = create(:user, current_workspace: company)
    create(:employment, company:, user: stranger, joined_at: Date.new(2020, 1, 1), resigned_at: nil)
    stranger.add_role(:employee, company)
    sign_in stranger
    get path, params: { company_id: company.id, user_id: consultant.id }
    expect(response).to have_http_status(:forbidden)
    expect(ConsultantInvoiceAuthorization.count).to eq(0)
  end

  it "denies forged input, stale workspace, foreign targets and stale predecessors" do
    input = command(summary)
    save(input.merge(actor_id: owner.id.to_s))
    expect(response).to have_http_status(422)
    save(input.merge(action: ["grant"]))
    expect(response).to have_http_status(422)
    save(input, company_id: company.id + 1)
    expect(response).to have_http_status(:conflict)
    save(input, company_id: nil)
    expect(response).to have_http_status(:conflict)
    other = create(:user)
    save(input, user_id: other.id)
    expect(response).to have_http_status(:not_found)
    save(input)
    expect(response).to have_http_status(:created)
    save(input.merge(idempotency_key: SecureRandom.uuid))
    expect(response).to have_http_status(:conflict)
    expect(ConsultantInvoiceAuthorization.count).to eq(1)
  end

  it "preserves self withdrawal after exit without allowing another grant" do
    save(command(summary))
    expect(response).to have_http_status(:created)
    employment.update!(resigned_at: Date.yesterday)
    facts = summary
    expect(facts).to include("can_grant" => false, "can_withdraw" => true)
    save(command(facts, action: "withdraw"))
    expect(response).to have_http_status(:created)
    save(command(summary))
    expect(response).to have_http_status(:forbidden)
    expect(summary.fetch("status")).to eq("withdrawn")
  end

  it "requires CSRF protection for session-authenticated commands" do
    input = command(summary)
    klass = Api::V1::ConsultantInvoiceAuthorizationsController
    original = klass.allow_forgery_protection
    klass.allow_forgery_protection = true
    save(input)
    expect(response).to have_http_status(422)
    expect(ConsultantInvoiceAuthorization.count).to eq(0)
  ensure
    klass.allow_forgery_protection = original if klass
  end

  it "allows only assigned accounts to inspect a consultant without granting profile or consent-write access" do
    accounts = create(:user, current_workspace: company)
    create(:employment, company:, user: accounts, joined_at: Date.new(2020, 1, 1), resigned_at: nil)
    accounts.add_role(:book_keeper, company)
    sign_in accounts
    get path, params: { company_id: company.id, user_id: consultant.id }
    expect(response).to have_http_status(:forbidden)
    run = PayrollRun.create!(company:, period: Date.new(2026, 11, 1), currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
    expect(summary).to include("can_grant" => false, "can_withdraw" => false)
    save(command(summary))
    expect(response).to have_http_status(:forbidden)
    get "/api/v1/employee_records", params: { user_id: consultant.id }
    expect(response).to have_http_status(:forbidden)
    get "/api/v1/payroll_runs/#{run.id}/preparation", params: { company_id: company.id, cutoff: "2026-12-05" }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("consultants").find { |row| row["employment_id"] == employment.id })
      .to include("user_id" => consultant.id)
  end

  it "advertises profile capability without recording consent and filters command details" do
    get "/api/v1/employee_records", params: { user_id: consultant.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("employee_record", "can_view_invoice_authorization")).to be(true)
    expect(ConsultantInvoiceAuthorization.count).to eq(0)
    filtered = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
      .filter("invoice_authorization" => { "action" => "grant", "idempotency_key" => "PRIVATE_COMMAND" })
    expect(filtered).to eq("invoice_authorization" => "[FILTERED]")
  end

  it "keeps self history and withdrawal available when payroll is turned off without allowing new grants" do
    save(command(summary))
    expect(response).to have_http_status(:created)
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    facts = summary
    expect(facts).to include("can_grant" => false, "can_withdraw" => true)
    save(command(facts, action: "withdraw"))
    expect(response).to have_http_status(:created)
    save(command(summary))
    expect(response).to have_http_status(:forbidden)
    expect(summary.fetch("status")).to eq("withdrawn")
  end
end
