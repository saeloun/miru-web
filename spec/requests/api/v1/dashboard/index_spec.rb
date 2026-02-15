# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Dashboard#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request :get, api_v1_dashboard_index_path, headers: auth_headers(user)
    end

    it "returns success" do
      expect(response).to have_http_status(:ok)
    end

    it "returns dashboard data" do
      expect(json_response).to be_a(Hash)
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, api_v1_dashboard_index_path, headers: auth_headers(user)
    end

    it "returns success" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      send_request :get, api_v1_dashboard_index_path
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
