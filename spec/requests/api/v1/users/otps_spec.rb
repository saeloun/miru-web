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
    expect(json_response.dig("user", "token")).to be_nil
    expect(json_response["company_role"]).to eq("admin")
    expect(json_response.dig("company", "id")).to eq(company.id)
  end

  it "does not disclose workspace choices before OTP verification" do
    other_company = create(:company, name: "Other")
    create(:employment, company: other_company, user:)
    user.add_role :admin, other_company

    post "/api/v1/users/otp/request", params: { phone: "+91 98765 43210" }

    expect(response).to have_http_status(:accepted)
    expect(json_response).not_to have_key("workspaces")
    expect(json_response["pending_token"]).to be_present
  end

  it "returns the same challenge shape for an unknown phone" do
    post "/api/v1/users/otp/request", params: { phone: "+91 99999 99999" }

    expect(response).to have_http_status(:accepted)
    expect(json_response).to include("message" => "OTP sent", "otp_sent" => true)
    expect(json_response["pending_token"]).to be_present
  end

  it "rejects verification after workspace access is removed" do
    post "/api/v1/users/otp/request", params: { phone: "9876543210" }
    pending_token = json_response["pending_token"]
    user.employments.find_by!(company:).discard!

    post "/api/v1/users/otp/verify", params: {
      pending_token:,
      code: "123456"
    }

    expect(response).to have_http_status(:unprocessable_content)
    expect(json_response["error"]).to eq("OTP expired or invalid. Request a new code.")
  end
end
