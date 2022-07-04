# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies#new", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request :get, new_company_path
    end

    it "is successful" do
      expect(response).to be_successful
    end

    it "renders Company#new page" do
      expect(response.body).to include("Setup Org")
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, new_company_path
    end

    it "is successful" do
      expect(response).to be_successful
    end

    it "renders Company#new page" do
      expect(response.body).to include("Setup Org")
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :get, new_company_path
    end

    it "is successful" do
      expect(response).to be_successful
    end

    it "renders Company#new page" do
      expect(response.body).to include("Setup Org")
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request :get, new_company_path
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
