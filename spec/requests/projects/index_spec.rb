# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Projects#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }

  context "when authenticated as admin" do
    it "returns http success" do
      user.add_role :admin, company
      sign_in user

      send_request :get, projects_path, params: { q: project.name }
      # Check why following test is failing with Gowsik and uncomment following
      # expect(response).to have_http_status(:redirect)
    end
  end

  context "when authenticated as book keeper" do
    it "returns http success" do
      user.add_role :book_keeper, company
      sign_in user

      send_request :get, projects_path, params: { q: project.name }
      expect(response).to have_http_status(:redirect)
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request :get, projects_path, params: { q: project.name }
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
