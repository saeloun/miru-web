# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Workspaces#update", type: :request, tt: true do
  let(:company) { create(:company) }
  let(:company_2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      create(:employment, company_id: company_2.id, user:)
      user.add_role :admin, company
      user.add_role :employee, company
      sign_in user
      send_request :patch, api_v1_workspace_path(company_2)
    end

    it "is successful" do
      expect(response).to be_successful
    end

    it "updates user's current workspace id" do
      user.reload
      expect(user).to have_attributes(current_workspace_id: company_2.id)
    end

    it "returns success json response" do
      expect(json_response["success"]).to match(true)
      expect(json_response["workspace"]["id"]).to match(company_2.id)
      expect(json_response["notice"]).to match("Workspace switched successfully")
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      create(:employment, company_id: company_2.id, user:)
      user.add_role :employee, company
      user.add_role :employee, company
      sign_in user
      send_request :patch, api_v1_workspace_path(company_2)
    end

    it "is successful" do
      expect(response).to be_successful
    end

    it "updates user's current workspace id" do
      user.reload
      expect(user).to have_attributes(current_workspace_id: company_2.id)
    end

    it "returns success json response" do
      expect(json_response["success"]).to match(true)
      expect(json_response["workspace"]["id"]).to match(company_2.id)
      expect(json_response["notice"]).to match("Workspace switched successfully")
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request :patch, api_v1_workspace_path(company)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to match("You need to sign in or sign up before continuing.")
    end
  end
end
