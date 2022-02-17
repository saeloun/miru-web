# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies#new", type: :request do
  let (:user) { create(:user) }

  context "When authenticated" do
    before do
      user.add_role :admin
      sign_in user
      get new_company_path
    end

    before(:each, :user_employee) do
      user.remove_role :admin
      user.add_role :employee
      get new_company_path
    end

    it "is successful " do
      expect(response).to be_successful
    end

    it "renders Company#new page" do
      expect(response.body).to include("Setup Org")
    end

    it "employee can't visit Company#new page", user_employee: true do
      expect(response).to have_http_status(:redirect)
      expect(flash[:alert]).to eq("You are not authorized to create new company.")
    end
  end
end
