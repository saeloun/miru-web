# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::SsoSettings", type: :request do
  let(:company) { create(:company, plan_tier: "paid") }
  let(:user) { create(:user, email: "admin@saeloun.com", current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    create(:identity, user:)
    user.add_role :admin, company
    sign_in user
  end

  it "updates normalized SSO settings" do
    put api_v1_sso_setting_path, params: {
      company: { sso_enforced: true, allowed_sso_domains: [" SAeloun.com "] }
    }

    expect(response).to have_http_status(:ok)
    expect(company.reload).to have_attributes(sso_enforced: true, allowed_sso_domains: ["saeloun.com"])
  end

  it "denies workspaces without Pro access" do
    company.update!(plan_tier: "free")

    put api_v1_sso_setting_path, params: { company: { sso_enforced: true } }

    expect(response).to have_http_status(:forbidden)
  end

  it "denies users who are not admins or owners" do
    user.remove_role :admin, company
    user.add_role :employee, company

    put api_v1_sso_setting_path, params: { company: { sso_enforced: true } }

    expect(response).to have_http_status(:forbidden)
  end

  it "returns a validation error when the change would lock out the actor" do
    put api_v1_sso_setting_path, params: {
      company: { sso_enforced: true, allowed_sso_domains: ["example.com"] }
    }

    expect(response).to have_http_status(:unprocessable_content)
    expect(json_response["errors"]).to eq("Allowed sso domains must include your own email domain when SSO is required")
  end
end
