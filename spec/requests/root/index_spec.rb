# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Root#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request :get, root_path
    end

    it "redirects to Dashboard#index page" do
      expect(response).to redirect_to(time_tracking_index_path)
    end
  end

  context "when user is an owner" do
    before do
      create(:company_user, company:, user:)
      user.add_role :owner, company
      sign_in user
      send_request :get, root_path
    end

    it "redirects to Dashboard#index page" do
      expect(response).to redirect_to(time_tracking_index_path)
    end
  end

  context "when user is an employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, root_path
    end

    it "redirects to TimeTracking#index page" do
      expect(response).to redirect_to(time_tracking_index_path)
    end
  end

  context "when user is a book keeper" do
    before do
      create(:company_user, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :get, root_path
    end

    it "redirects to payments#index page" do
      expect(response).to redirect_to(payments_path)
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request :get, root_path
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
