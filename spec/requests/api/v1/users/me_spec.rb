# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users#me", type: :request do
  let(:company) do
    create(
      :company,
      date_format: "DD-MM-YYYY",
      business_phone: "+14155552671",
      tax_id: "TAX-123",
      ein: "12-3456789",
      us_taxpayer_id: "987-65-4321"
    )
  end
  let(:user) do
    create(
      :user,
      current_workspace_id: company.id,
      date_of_birth: Date.new(1992, 4, 10),
      phone: "+919999999999",
      personal_email_id: "person@example.com",
      social_accounts: {
        github_url: "https://github.com/example",
        linkedin_url: "https://linkedin.com/in/example"
      }
    )
  end

  context "when user is authenticated" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "returns current user info" do
      get api_v1_users_me_path, headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json_response["user"]["id"]).to eq(user.id)
      expect(json_response["user"]["email"]).to eq(user.email)
      expect(json_response["user"]["first_name"]).to eq(user.first_name)
      expect(json_response["user"]["last_name"]).to eq(user.last_name)
      expect(json_response["user"]["phone"]).to eq(user.phone)
      expect(json_response["user"]["personal_email_id"]).to eq(user.personal_email_id)
      expect(json_response["user"]["locale"]).to eq(user.locale)
      expect(json_response["user"]["social_accounts"]).to eq(user.social_accounts)
      expect(json_response["user"]["date_format"]).to eq(company.date_format)
    end

    it "returns company info" do
      get api_v1_users_me_path, headers: auth_headers(user)
      expect(json_response["company"]["id"]).to eq(company.id)
      expect(json_response["company"]["name"]).to eq(company.name)
      expect(json_response["company"]["business_phone"]).to eq(company.business_phone)
      expect(json_response["company"]["tax_id"]).to eq(company.tax_id)
      expect(json_response["company"]["ein"]).to eq(company.ein)
      expect(json_response["company"]["us_taxpayer_id"]).to eq(company.us_taxpayer_id)
      expect(json_response["company"]["address"]["address_line_1"]).to eq(company.current_address.address_line_1)
      expect(json_response["company"]["logo"]).to eq(company.company_logo)
    end

    it "returns the user role" do
      get api_v1_users_me_path, headers: auth_headers(user)
      expect(json_response["company_role"]).to eq("admin")
    end
  end

  context "when authenticated with a cli session" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
    end

    it "returns current user info" do
      _, cli_token = CliSession.issue_for(user:, company:)

      get api_v1_users_me_path, headers: cli_auth_headers(cli_token)

      expect(response).to have_http_status(:ok)
      expect(json_response["user"]["id"]).to eq(user.id)
      expect(json_response["user"]["email"]).to eq(user.email)
      expect(json_response["company"]["id"]).to eq(company.id)
      expect(json_response["company_role"]).to eq("admin")
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      get api_v1_users_me_path
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
