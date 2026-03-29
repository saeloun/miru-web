# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::OmniauthCallbacks#google_oauth2", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when the user oauth is valid" do
    before do
      OmniAuth.config.mock_auth[:google_oauth2] = build(:google_user_data)
      create(:employment, company:, user:)
      user.add_role :admin, company

      send_request :post, user_google_oauth2_omniauth_callback_path
    end

    it "redirects to dashboard page" do
      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to("#{root_path}?google_oauth_success=true")
    end

    it "returns a success flash message" do
      expect(flash[:notice]).to eq("Successfully authenticated from Google account.")
    end
  end

  context "when the user oauth is invalid" do
    before do
      OmniAuth.config.mock_auth[:google_oauth2] = :invalid_credentials
      create(:employment, company:, user:)
      user.add_role :admin, company

      send_request :post, user_google_oauth2_omniauth_callback_path
    end

    it "redirects to sign in page" do
      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to(root_path)
    end

    it "returns a failed authentication flash message" do
      expect(flash[:alert]).to eq('Could not authenticate you from GoogleOauth2 because "Invalid credentials".')
    end
  end

  context "when the user uid in oauth is not present" do
    before do
      google_user_data = build(:google_user_data)
      google_user_data.uid = nil
      OmniAuth.config.mock_auth[:google_oauth2] = google_user_data
      create(:employment, company:, user:)
      user.add_role :admin, company

      send_request :post, user_google_oauth2_omniauth_callback_path
    end

    it "redirects to sign up page" do
      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to(root_path)
    end

    it "returns a failed authentication flash message" do
      expect(flash[:error])
        .to eq("There was a problem signing you in through Google. Please register or try signing in later.")
    end
  end

  describe "oauth initiation host" do
    around do |example|
      original_app_base_url = ENV["APP_BASE_URL"]
      original_full_host = OmniAuth.config.full_host
      ENV["APP_BASE_URL"] = "https://app.miru.so"
      OmniAuth.config.full_host = lambda do |_env|
        ENV.fetch("APP_BASE_URL")
      end
      example.run
    ensure
      ENV["APP_BASE_URL"] = original_app_base_url
      OmniAuth.config.full_host = original_full_host
    end

    it "uses APP_BASE_URL as the configured full host" do
      full_host = OmniAuth.config.full_host.respond_to?(:call) ? OmniAuth.config.full_host.call(nil) : OmniAuth.config.full_host

      expect(full_host).to eq("https://app.miru.so")
    end
  end
end
