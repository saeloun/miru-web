# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Reports#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
      sign_in user
      send_request :get, reports_path
    end

    it "renders Reports#index page" do
      expect(response).to be_successful
      expect(response.body).to include("Time entry report")
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :employee, company
      sign_in user
      send_request :get, reports_path
    end

    it "does not render Reports#index page" do
      expect(response).not_to be_successful
    end
  end

  context "when unauthenticated" do
    it "user should be redirected to sign in path" do
      send_request :get, reports_path
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
