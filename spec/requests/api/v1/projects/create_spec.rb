# frozen_string_literal: true

# config/database.ymo frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Project#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "#create" do
      it "creates the project successfully" do
        project = attributes_for(:project, client_id: client.id)
        send_request :post, api_v1_projects_path(project:), headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expected_attrs = ["billable", "description", "id", "name", "notice"]
        expect(json_response.keys.sort).to match(expected_attrs)
      end

      it "throws 422 if the client doesn't exist" do
        send_request :post, api_v1_projects_path(
          project: {
            name: "Test Project",
            description: "Rspec Test",
            billable: false
          }), headers: auth_headers(user)
        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to eq("Client must exist")
      end
    end
  end

  context "when the user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :post, api_v1_projects_path, headers: auth_headers(user)
    end

    it "is not be permitted to generate an project" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when the user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :post, api_v1_projects_path, headers: auth_headers(user)
    end

    it "is not be permitted to generate an project" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to generate an project" do
      send_request :post, api_v1_projects_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
