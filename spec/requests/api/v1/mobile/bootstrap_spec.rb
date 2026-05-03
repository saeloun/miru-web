# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Mobile::Bootstrap", type: :request do
  let(:company) { create(:company, base_currency: "INR", date_format: "DD-MM-YYYY") }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    sign_in user
  end

  it "returns the authenticated mobile session context" do
    user.add_role :admin, company

    send_request :get, api_v1_mobile_bootstrap_path, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response["user"]["id"]).to eq(user.id)
    expect(json_response["company_role"]).to eq("admin")
    expect(json_response["workspace"]).to include(
      "id" => company.id,
      "name" => company.name,
      "base_currency" => "INR",
      "date_format" => "DD-MM-YYYY"
    )
    expect(json_response["capabilities"]).to include(
      "time_tracking" => true,
      "projects" => true,
      "expenses" => true,
      "invoices" => true,
      "collections" => false,
      "payments" => true,
      "payment_settings" => true,
      "team" => true
    )
  end

  it "keeps employee capabilities focused on time tracking" do
    user.add_role :employee, company

    send_request :get, api_v1_mobile_bootstrap_path, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response["capabilities"]).to include(
      "time_tracking" => true,
      "projects" => true,
      "expenses" => true,
      "invoices" => false,
      "collections" => false,
      "payments" => false,
      "payment_settings" => false,
      "team" => false
    )
  end

  it "enables field collections for pro team employees" do
    company.update!(plan_tier: "paid")
    user.add_role :employee, company

    send_request :get, api_v1_mobile_bootstrap_path, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response.dig("capabilities", "collections")).to eq(true)
  end
end
