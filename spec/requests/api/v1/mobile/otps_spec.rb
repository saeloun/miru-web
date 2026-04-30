# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Mobile::Otps", type: :request do
  let(:company) { create(:india_company) }
  let(:customer) { create(:user, current_workspace_id: company.id, phone: "+919876543210") }

  before do
    create(:employment, company:, user: customer)
    customer.add_role :client, company
  end

  it "requests and verifies a phone OTP for a customer login" do
    post "/api/v1/mobile/otp/request", params: { phone: "9876543210" }

    expect(response).to have_http_status(:accepted)
    expect(json_response["pending_token"]).to be_present
    expect(json_response["test_code"]).to eq("123456")

    post "/api/v1/mobile/otp/verify", params: {
      pending_token: json_response["pending_token"],
      code: "123456"
    }

    expect(response).to have_http_status(:ok)
    expect(json_response.dig("user", "token")).to eq(customer.reload.token)
    expect(json_response["company_role"]).to eq("client")
    expect(json_response.dig("company", "id")).to eq(company.id)
  end

  it "asks the app to choose a workspace when a phone belongs to multiple workspaces" do
    other_company = create(:company, name: "Other")
    create(:employment, company: other_company, user: customer)
    customer.add_role :client, other_company

    post "/api/v1/mobile/otp/request", params: { phone: "+91 98765 43210" }

    expect(response).to have_http_status(:conflict)
    expect(json_response["requires_workspace"]).to eq(true)
    expect(json_response["workspaces"].map { |workspace| workspace["id"] }).to contain_exactly(company.id, other_company.id)
  end

  it "rejects an invalid OTP" do
    post "/api/v1/mobile/otp/request", params: { phone: "9876543210" }

    post "/api/v1/mobile/otp/verify", params: {
      pending_token: json_response["pending_token"],
      code: "000000"
    }

    expect(response).to have_http_status(:unprocessable_content)
    expect(json_response["error"]).to eq("Invalid OTP")
  end
end
