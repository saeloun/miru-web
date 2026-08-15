# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::AuditLogsController#index", type: :request do
  let(:company) { create(:company, plan_tier: "paid") }
  let(:other_company) { create(:company, plan_tier: "paid") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:other_client) { create(:client, company: other_company) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  it "returns only audits associated with the current company" do
    current_audit = create_audit(auditable: client, associated: company)
    other_audit = create_audit(auditable: other_client, associated: other_company)

    send_request :get, api_v1_audit_logs_path, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    ids = json_response.fetch("audit_logs").pluck("id")
    expect(ids).to include(current_audit.id)
    expect(ids).not_to include(other_audit.id)
  end

  it "filters by type, action, user, and date range" do
    matching_audit = travel_to(Date.new(2026, 8, 10).noon) do
      create_audit(auditable: client, associated: company, user:, action: "update")
    end
    create_audit(auditable: company, action: "create")

    send_request :get, api_v1_audit_logs_path,
      params: {
        auditable_type: "Client",
        action: "update",
        user_id: user.id,
        from: "2026-08-10",
        to: "2026-08-10"
      },
      headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response.fetch("audit_logs").pluck("id")).to eq([matching_audit.id])
  end

  it "strips sensitive keys recursively" do
    audit = create_audit(
      auditable: client,
      associated: company,
      audited_changes: {
        "name" => ["Old", "New"],
        "token" => ["old-token", "new-token"],
        "bank_account_number" => ["old-account", "new-account"],
        "metadata" => { "password_digest" => "digest", "safe" => "value" }
      }
    )

    send_request :get, api_v1_audit_logs_path, headers: auth_headers(user)

    serialized = json_response.fetch("audit_logs").find { |item| item["id"] == audit.id }
    expect(serialized.fetch("audited_changes")).to eq(
      "name" => ["Old", "New"],
      "metadata" => { "safe" => "value" }
    )
  end

  it "returns a structured 400 for malformed date filters" do
    send_request :get, api_v1_audit_logs_path(from: "not-a-date"), headers: auth_headers(user)

    expect(response).to have_http_status(:bad_request)
    expect(json_response["errors"]).to eq("from must be a valid ISO 8601 date")
  end

  it "associates project audits with the company through the client chain" do
    project = create(:project, client:)
    project.update!(name: "Renamed Project")

    audit = Audited::Audit.where(auditable: project, action: "update").last
    expect(audit.associated).to eq(company)

    send_request :get, api_v1_audit_logs_path(auditable_type: "Project"), headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response["audit_logs"].pluck("auditable_id")).to include(project.id)
  end

  it "denies non-admins" do
    user.remove_role :admin, company
    user.add_role :employee, company

    send_request :get, api_v1_audit_logs_path, headers: auth_headers(user)

    expect(response).to have_http_status(:forbidden)
  end

  it "denies workspaces without Pro access" do
    company.update!(plan_tier: "free")

    send_request :get, api_v1_audit_logs_path, headers: auth_headers(user)

    expect(response).to have_http_status(:forbidden)
  end

  private

    def create_audit(auditable:, associated: nil, user: nil, action: "update", audited_changes: { "name" => ["Old", "New"] })
      Audited::Audit.create!(auditable:, associated:, user:, action:, audited_changes:)
    end
end
