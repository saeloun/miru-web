# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies#show", type: :request do
  let (:company) { create(:company) }
  let (:user) { create(:user, company_id: company.id) }

  context "When authenticated" do
    before do
      user.add_role :admin
      sign_in user
      get company_path
    end

    before(:each, :user_employee) do
      user.remove_role :admin
      user.add_role :employee
      get company_path
    end

    it "is successful " do
      expect(response).to be_successful
    end

    it "renders Company#new page" do
      expect(response.body).to include("Settings")
      expect(response.body).to include("ORGANIZATION SETTINGS")
    end

    it "employee can't visit Company#show page", user_employee: true do
      expect(response).to have_http_status(:redirect)
      expect(flash[:alert]).to eq("You are not authorized to view company.")
    end
  end
end
