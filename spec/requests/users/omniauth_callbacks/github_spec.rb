# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::OmniauthCallbacks#github", type: :request do
  context "when the user oauth is valid" do
    before do
      OmniAuth.config.mock_auth[:github] = build(:github_user_data)

      send_request :post, user_github_omniauth_callback_path
    end

    it "redirects to dashboard page" do
      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to("#{root_path}?google_oauth_success=true")
    end

    it "returns a success flash message" do
      expect(flash[:notice]).to eq("Successfully authenticated from GitHub account.")
    end
  end

  context "when the user oauth is invalid" do
    before do
      OmniAuth.config.mock_auth[:github] = :invalid_credentials

      send_request :post, user_github_omniauth_callback_path
    end

    it "redirects to sign in page" do
      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to(root_path)
    end

    it "returns a failed authentication flash message" do
      expect(flash[:alert]).to include("Invalid credentials")
      expect(flash[:alert]).to include("GitHub").or include("Github")
    end
  end

  context "when the user uid in oauth is not present" do
    before do
      github_user_data = build(:github_user_data)
      github_user_data.uid = nil
      OmniAuth.config.mock_auth[:github] = github_user_data

      send_request :post, user_github_omniauth_callback_path
    end

    it "redirects to sign up page" do
      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to(root_path)
    end

    it "returns a failed authentication flash message" do
      expect(flash[:error])
        .to eq("There was a problem signing you in through GitHub. Please register or try signing in later.")
    end
  end
end
