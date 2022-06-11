# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies#show", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request :get, company_path
    end

    it "is successful" do
      expect(response).to be_successful
    end

    it "renders Company#new page" do
      expect(response.body).to include("Settings")
      expect(response.body).to include("ORGANIZATION SETTINGS")
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, company_path
    end

    it "is not permitted to visit Company#show page" do
      expect(response).to have_http_status(:redirect)
      expect(flash[:alert]).to eq("You are not authorized to view company.")
    end
  end

  context "when user is book keeper" do
    before do
      create(:company_user, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :get, company_path
    end

    it "is not permitted to visit Company#show page" do
      expect(response).to have_http_status(:redirect)
      expect(flash[:alert]).to eq("You are not authorized to view company.")
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request :get, company_path
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
