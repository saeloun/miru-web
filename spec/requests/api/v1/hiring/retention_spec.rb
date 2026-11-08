# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring retention", type: :request do
  include_context "issued offer records"
  let(:path) { "/api/v1/hiring/applications/#{application.id}/retention" }

  before { sign_in admin }

  it "reviews only safe deletion counts and requires an explicit boolean confirmation" do
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    review = response.parsed_body
    expect(review).to include("company_id" => company.id, "application_version" => application.reload.lock_version)
    expect(review.fetch("retention")).to include("employee_records_preserved" => true, "legal_documents_preserved" => true, "blocked_reason" => nil)
    expect(response.body).not_to include("candidate@example.test", candidate_name, "PRIVATE ADMIN NOTE")
    expect(response.headers["Cache-Control"]).to include("no-store")
    input = review.slice("company_id", "application_version")
    [nil, false, "true"].each do |confirmation|
      delete path, params: { hiring_retention: input.merge("confirmation" => confirmation) }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
      expect(application.reload).to be_present
    end
    delete path, params: { hiring_retention: input.merge("confirmation" => true) }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq("company_id" => company.id, "deleted" => true)
    expect(HiringApplication.exists?(application.id)).to be(false)
  end

  it "rejects stale review, foreign workspace and non-admin access" do
    input = { company_id: company.id, application_version: application.reload.lock_version - 1, confirmation: true }
    delete path, params: { hiring_retention: input }, as: :json
    expect(response).to have_http_status(:conflict)
    delete path, params: { hiring_retention: input.merge(company_id: create(:company).id) }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(response.parsed_body["workspace_changed"]).to be(true)
    get path, params: { company_id: create(:company).id }
    expect(response).to have_http_status(:conflict)
    expect(response.parsed_body["workspace_changed"]).to be(true)
    admin.remove_role(:admin, company)
    admin.add_role(:employee, company)
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
  end

  it "cannot review or delete another tenant's application through its known ID" do
    other = create(:company)
    candidate = other.hiring_candidates.create!(full_name: Faker::Name.name, email: Faker::Internet.email)
    record = other.hiring_applications.create!(hiring_candidate: candidate, request_key: SecureRandom.uuid,
      source: "manual", received_at: Time.current, creation_details: { "full_name" => candidate.full_name })
    foreign_path = "/api/v1/hiring/applications/#{record.id}/retention"
    get foreign_path, params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
    delete foreign_path, params: { hiring_retention: { company_id: company.id, application_version: record.lock_version, confirmation: true } }, as: :json
    expect(response).to have_http_status(:not_found)
    expect(record.reload).to be_present
    expect(response.body).not_to include(candidate.email, candidate.full_name)
  end

  it "keeps policy disabled by default and validates approved retention settings" do
    get "/api/v1/hiring/settings", params: { company_id: company.id }
    expect(response.parsed_body.dig("settings", "details", "retention_enabled")).to be_falsey
    details = HiringSetting::TEXT_FIELDS.index_with { |field| "Approved #{field}" }.merge("client_count" => 5)
    [{ retention_enabled: "true", retention_days: 30 }, { retention_enabled: true, retention_days: nil },
      { retention_enabled: true, retention_days: 0 }, { retention_enabled: true, retention_days: 36_501 }].each do |invalid|
      put "/api/v1/hiring/settings", params: { hiring_setting: { company_id: company.id, lock_version: nil, details: details.merge(invalid) } }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
    put "/api/v1/hiring/settings", params: { hiring_setting: { company_id: company.id, lock_version: nil,
      details: details.merge("retention_enabled" => true, "retention_days" => 30) } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("settings", "approved")).to be(false)
    setting = company.reload.hiring_setting
    post "/api/v1/hiring/settings/approve", params: { hiring_setting: { company_id: company.id, lock_version: setting.lock_version } }, as: :json
    expect(response.parsed_body.dig("settings", "approved")).to be(true)
    put "/api/v1/hiring/settings", params: { hiring_setting: { company_id: company.id, lock_version: setting.reload.lock_version,
      details: setting.details.merge("retention_days" => 90) } }, as: :json
    expect(response.parsed_body.dig("settings", "approved")).to be(false)
  end
end
