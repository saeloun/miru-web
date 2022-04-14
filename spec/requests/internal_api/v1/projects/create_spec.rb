# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Project#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "project creation" do
      it "creates project successfully" do
        project = attributes_for(:project, client_id: client.id)
        send_request :post, internal_api_v1_projects_path(project:)
        expect(response).to have_http_status(:ok)
        expected_attrs = ["billable", "description", "id", "name"]
        expect(json_response.keys.sort).to match(expected_attrs)
      end

      it "throws 422 if client doesn't exist" do
        send_request :post, internal_api_v1_projects_path(
          project: {
            name: "Test Project",
            description: "Rspec Test",
            billable: false
          })
        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["errors"]["client"].first).to eq("must exist")
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :post, internal_api_v1_projects_path
    end

    it "is not be permitted to generate an project" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to generate an project" do
      send_request :post, internal_api_v1_projects_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
