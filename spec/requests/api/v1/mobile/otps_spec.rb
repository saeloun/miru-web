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
    workspace_ids = json_response["workspaces"].pluck("id")
    expect(workspace_ids).to contain_exactly(company.id, other_company.id)
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

  it "requests OTP through MSG91 when widget credentials are configured outside test" do
    allow(Rails.env).to receive(:test?).and_return(false)
    send_stub = stub_request(:post, "https://api.msg91.com/api/v5/widget/sendOtp")
      .to_return(status: 200, body: { type: "success", message: "request-123" }.to_json)
    verify_stub = stub_request(:post, "https://api.msg91.com/api/v5/widget/verifyOtp")
      .to_return(status: 200, body: { type: "success", "access-token": "jwt-token" }.to_json)
    access_token_stub = stub_request(:post, "https://api.msg91.com/api/v5/widget/verifyAccessToken")
      .to_return(status: 200, body: { type: "success", message: "919876543210" }.to_json)

    with_env(MSG91_AUTH_KEY: "msg91-secret", MSG91_WIDGET_ID: "widget-123") do
      post "/api/v1/mobile/otp/request", params: { phone: "9876543210" }

      expect(response).to have_http_status(:accepted)
      expect(json_response["pending_token"]).to be_present
      expect(json_response).not_to have_key("test_code")

      post "/api/v1/mobile/otp/verify", params: {
        pending_token: json_response["pending_token"],
        code: "123456"
      }

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("user", "token")).to eq(customer.reload.token)
    end

    expect(send_stub).to have_been_requested
    expect(verify_stub).to have_been_requested
    expect(access_token_stub).to have_been_requested
  end

  def with_env(values)
    originals = values.to_h { |key, _value| [key.to_s, ENV.fetch(key.to_s, nil)] }
    values.each do |key, value|
      value.nil? ? ENV.delete(key.to_s) : ENV[key.to_s] = value
    end

    yield
  ensure
    originals.each do |key, value|
      value.nil? ? ENV.delete(key) : ENV[key] = value
    end
  end
end
