# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users::Otps", type: :request do
  let(:company) { create(:india_company) }
  let(:user) { create(:user, current_workspace_id: company.id, phone: "+919876543210") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
  end

  it "requests and verifies a phone OTP for web login" do
    post "/api/v1/users/otp/request", params: { phone: "9876543210" }

    expect(response).to have_http_status(:accepted)
    expect(json_response["pending_token"]).to be_present
    expect(json_response["test_code"]).to eq("123456")

    post "/api/v1/users/otp/verify", params: {
      pending_token: json_response["pending_token"],
      code: "123456"
    }

    expect(response).to have_http_status(:ok)
    expect(json_response.dig("user", "token")).to eq(user.reload.token)
    expect(json_response["company_role"]).to eq("admin")
    expect(json_response.dig("company", "id")).to eq(company.id)
  end

  it "returns workspace choices when the phone belongs to multiple workspaces" do
    other_company = create(:company, name: "Other")
    create(:employment, company: other_company, user:)
    user.add_role :admin, other_company

    post "/api/v1/users/otp/request", params: { phone: "+91 98765 43210" }

    expect(response).to have_http_status(:conflict)
    expect(json_response["requires_workspace"]).to eq(true)
    workspace_ids = json_response["workspaces"].pluck("id")
    expect(workspace_ids).to contain_exactly(company.id, other_company.id)
  end
end
