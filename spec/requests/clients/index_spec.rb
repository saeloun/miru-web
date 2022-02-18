# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client#index", type: :request do
  let (:company) { create(:company) }
  let (:user) { create(:user, company_id: company.id) }

  context "When user is admin" do
    before do
      user.add_role :admin
      sign_in user
      send_request :get, clients_path
    end

    it "is successful " do
      expect(response).to be_successful
    end

    it "renders Client#index page" do
      expect(response.body).to include("Clients")
      expect(response.body).to include("NEW CLIENT")
    end
  end

  context "When user is employee" do
    before do
      user.add_role :employee
      sign_in user
      send_request :get, clients_path
    end

    it "renders Client#index page" do
      expect(response.body).to include("Clients")
      expect(response.body).not_to include("NEW CLIENT")
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request :get, clients_path
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
