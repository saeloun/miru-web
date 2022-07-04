# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Dashboard#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request :get, dashboard_index_path
    end

    it "renders Dashboard#index page" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, dashboard_index_path
    end

    it "redirect to root path" do
      expect(response).to have_http_status(:redirect)
    end

    it "is not permitted to visit dashboard#index page" do
      expect(flash[:alert]).to eq("You are not authorized to view dashboard.")
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :get, dashboard_index_path
    end

    it "redirect to root path" do
      expect(response).to have_http_status(:redirect)
    end

    it "is not permitted to visit dashboard#index page" do
      expect(flash[:alert]).to eq("You are not authorized to view dashboard.")
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request :get, dashboard_index_path
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
