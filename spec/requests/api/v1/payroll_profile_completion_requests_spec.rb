# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payroll profile completion requests", type: :request do
  include_context "approved mercury consultant payroll"

  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }

  before do
    employment.update!(joined_at: "2020-01-01")
    worker.add_role(:employee, company)
    employment.employee_record.update!(private_details: bank_details.except("bank_country"))
    sign_in accounts
  end

  def send_request(**overrides)
    source = Payroll::ProfileCompletion.new(run, actor: accounts).current_source(employment)
    post "/api/v1/payroll_runs/#{run.id}/profile_completion_requests", params: {
      company_id: company.id, employment_id: employment.id.to_s,
      expected_digest: source[:source_digest], idempotency_key: "profile-http"
    }.merge(overrides), as: :json
  end

  it "returns the committed private receipt and exact replay to assigned accounts" do
    send_request
    expect(response).to have_http_status(:accepted), response.body
    original = json_response.fetch("profile_completion_request")
    expect(original).to include("state" => "queued", "categories" => ["bank_details"])
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.body).not_to include(worker.email, bank_details.fetch("bank_account_number"), bank_details.fetch("bank_name"), "command_digest")
    send_request
    expect(response).to have_http_status(:accepted)
    expect(json_response.fetch("profile_completion_request")).to eq(original)
    expect(PayrollProfileCompletionRequest.count).to eq(1)
  end

  it "allows the scoped owner without broadening bank-profile access for accounts" do
    sign_in owner
    send_request
    expect(response).to have_http_status(:accepted)
    sign_in accounts
    get "/api/v1/employee_records", params: { company_id: company.id, user_id: worker.id }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "rejects foreign employment, stale workspace and a missing explicit workspace" do
    send_request(employment_id: create(:employment).id.to_s)
    expect(response).to have_http_status(:not_found)
    send_request(company_id: create(:company).id)
    expect(response).to have_http_status(:conflict)
    send_request(company_id: nil)
    expect(response).to have_http_status(:conflict)
    expect(PayrollProfileCompletionRequest.count).to eq(0)
  end

  it "rejects unassigned and revoked reviewers without disclosing a request or consultant details" do
    other = create(:user, current_workspace: company)
    create(:employment, company:, user: other, joined_at: "2020-01-01", resigned_at: nil)
    other.add_role(:book_keeper, company)
    sign_in other
    send_request
    expect(response).to have_http_status(:forbidden)
    sign_in accounts
    accounts.remove_role(:book_keeper, company)
    send_request
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include(worker.email, "profile_completion_request")
    expect(PayrollProfileCompletionRequest.count).to eq(0)
  end

  it "rejects caller-selected recipients, categories and prose" do
    [{ recipient_id: owner.id }, { recipient_email: owner.email }, { categories: ["billing_identity"] }, { message: "Please grant invoice consent" }].each do |extra|
      send_request(**extra)
      expect(response).to have_http_status(:unprocessable_content)
    end
    expect(PayrollProfileCompletionRequest.count).to eq(0)
  end

  it "rejects missing or structured command fields and stale sources without creating jobs" do
    [{ employment_id: {} }, { expected_digest: [] }, { idempotency_key: {} }, { expected_digest: nil }, { expected_digest: "a" * 64 }].each do |extra|
      send_request(**extra)
      expect(response).to have_http_status(extra[:expected_digest] == "a" * 64 ? :conflict : :unprocessable_content)
    end
    expect(PayrollProfileCompletionRequest.count).to eq(0)
  end

  it "does not turn completed details into a reminder or require invoice consent" do
    employment.employee_record.update!(private_details: bank_details)
    send_request(expected_digest: "a" * 64)
    expect(response).to have_http_status(:unprocessable_content)
    expect(json_response.fetch("codes")).to eq(["profile_completion_unavailable"])
    expect(PayrollProfileCompletionRequest.count).to eq(0)
  end

  it "requires an authenticated account" do
    sign_out accounts
    send_request
    expect(response).to have_http_status(:unauthorized)
    expect(PayrollProfileCompletionRequest.count).to eq(0)
  end

  it "protects a session-authenticated request from CSRF" do
    controller = Api::V1::PayrollProfileCompletionRequestsController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    send_request
    expect(response).to have_http_status(:unprocessable_content)
    expect(PayrollProfileCompletionRequest.count).to eq(0)
  ensure
    controller.allow_forgery_protection = original if controller
  end
end
