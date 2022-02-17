# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Team#index", type: :request do
  let (:company) { create(:company) }
  let(:user) { create(:user, company_id: company.id) }

  context "when authenticated" do
    before do
      user.add_role :admin
      sign_in user
    end

    before(:each, :user_employee) do
      user.remove_role :admin
      user.add_role :employee
    end

    it "returns http success" do
      get("/team")
      expect(response).to have_http_status(:ok)
    end

    it "admin can access Team#index page" do
      get("/team")
      expect(response).to have_http_status(:ok)
    end

    it "employee can access Team#index page", user_employee: true do
      get("/team")
      expect(response).to have_http_status(:ok)
    end
  end
end
