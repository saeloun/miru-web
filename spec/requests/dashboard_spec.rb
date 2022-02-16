# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Dashboard", type: :request do
  let (:company) { create(:company) }
  let(:user) { create(:user, company_id: company.id) }

  before(:each, :user_admin) do
    user.add_role :admin
  end

  before(:each, :user_employee) do
    user.add_role :employee
  end

  context "when authenticated" do
    before do
      sign_in user
    end

    it "returns http success" do
      get("/dashboard")
      expect(response).to have_http_status(:found)
    end

    it "admin can access dashboard", user_admin: true do
      get("/dashboard")
      expect(response).to have_http_status(:ok)
    end

    it "employee can't access dashboard", user_employee: true do
      get("/dashboard")
      expect(response).to have_http_status(:redirect)
      expect(flash[:alert]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      get("/dashboard")
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
