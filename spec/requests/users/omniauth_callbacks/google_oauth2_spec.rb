# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::OmniauthCallbacks#google_oauth2", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when the user oauth is valid" do
    before do
      OmniAuth.config.test_mode = true
      OmniAuth.config.mock_auth[:google_oauth2] = build(:google_user_data)
      create(:company_user, company:, user:)
      user.add_role :admin, company

      send_request :post, user_google_oauth2_omniauth_callback_path
    end

    it "redirects to dashboard page" do
      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to(root_path)
    end

    it "returns a success flash message" do
      expect(flash[:notice]).to eq("Successfully authenticated from Google account.")
    end
  end

  context "when the user oauth is invalid" do
    before do
      OmniAuth.config.test_mode = true
      OmniAuth.config.mock_auth[:google_oauth2] = :invalid_credentials
      create(:company_user, company:, user:)
      user.add_role :admin, company

      send_request :post, user_google_oauth2_omniauth_callback_path
    end

    it "redirects to sign in page" do
      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to(new_user_session_path)
    end

    it "returns a failed authentication flash message" do
      expect(flash[:alert]).to eq('Could not authenticate you from GoogleOauth2 because "Invalid credentials".')
    end
  end

  context "when the user uid in oauth is not present" do
    before do
      OmniAuth.config.test_mode = true
      google_user_data = build(:google_user_data)
      google_user_data.uid = nil
      OmniAuth.config.mock_auth[:google_oauth2] = google_user_data
      create(:company_user, company:, user:)
      user.add_role :admin, company

      send_request :post, user_google_oauth2_omniauth_callback_path
    end

    it "redirects to sign up page" do
      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to(new_user_registration_url)
    end

    it "returns a failed authentication flash message" do
      expect(flash[:error])
        .to eq("There was a problem signing you in through Google. Please register or try signing in later.")
    end
  end
end
