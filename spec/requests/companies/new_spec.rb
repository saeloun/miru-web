# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies#new", type: :request do
  let (:user) { create(:user) }

  context "When user is admin" do
    before do
      user.add_role :admin
      sign_in user
      get new_company_path
    end

    it "is successful " do
      expect(response).to be_successful
    end

    it "renders Company#new page" do
      expect(response.body).to include("Setup Org")
    end
  end

  context "When user is employee" do
    before do
      user.add_role :employee
      sign_in user
      get new_company_path
    end

    it "is not permitted to visit Company#new page" do
      expect(response).to have_http_status(:redirect)
      expect(flash[:alert]).to eq("You are not authorized to create new company.")
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      get new_company_path
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
