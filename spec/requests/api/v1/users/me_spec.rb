# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users#me", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is authenticated" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "returns current user info" do
      get api_v1_users_me_path, headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json_response["user"]["id"]).to eq(user.id)
      expect(json_response["user"]["email"]).to eq(user.email)
      expect(json_response["user"]["first_name"]).to eq(user.first_name)
      expect(json_response["user"]["last_name"]).to eq(user.last_name)
    end

    it "returns company info" do
      get api_v1_users_me_path, headers: auth_headers(user)
      expect(json_response["company"]["id"]).to eq(company.id)
      expect(json_response["company"]["name"]).to eq(company.name)
    end

    it "returns the user role" do
      get api_v1_users_me_path, headers: auth_headers(user)
      expect(json_response["company_role"]).to eq("admin")
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      get api_v1_users_me_path
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
