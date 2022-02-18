# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Team#index", type: :request do
  let (:company) { create(:company) }
  let(:user) { create(:user, company_id: company.id) }

  context "when user is admin" do
    before do
      user.add_role :admin
      sign_in user
      get("/team")
    end

    it "returns http success" do
      expect(response).to have_http_status(:ok)
    end

    it "is can access Team#index page" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when user is employee" do
    before do
      user.add_role :employee
      sign_in user
      get("/team")
    end

    it "is permitted to access Team#index page" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      get("/team")
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
