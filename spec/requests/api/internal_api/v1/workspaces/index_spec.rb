# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Workspaces#update", type: :request, tt: true do
  let(:company) { create(:company) }
  let(:company_2) { create(:company) }
  let(:company_3) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      create(:employment, company_id: company_2.id, user:)
      user.add_role :admin, company
      sign_in user
      send_request :get, api_v1_workspaces_path
    end

    it "is successful" do
      expect(response).to be_successful
    end

    it "returns the list of user's workspaces" do
      expect(json_response["workspaces"].count).to eq(2)
      expect(json_response["workspaces"].pluck("id")).to include(company.id, company_2.id)
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      create(:employment, company_id: company_2.id, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, api_v1_workspaces_path
    end

    it "is successful" do
      expect(response).to be_successful
    end

    it "returns the list of user's workspaces" do
      expect(json_response["workspaces"].count).to eq(2)
      expect(json_response["workspaces"].pluck("id")).to include(company.id, company_2.id)
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request :get, api_v1_workspaces_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to match("You need to sign in or sign up before continuing.")
    end
  end
end
