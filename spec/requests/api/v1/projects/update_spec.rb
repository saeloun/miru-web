# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Project#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "#update" do
      it "updates project successfully" do
        send_request :patch, api_v1_project_path(
          id: project.id, params: {
            project: {
              description: "test for update"
            }
          }), headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["description"]).to eq("test for update")
      end

      it "throws 422 if the client doesn't exist" do
        send_request :patch, api_v1_project_path(
          id: project.id, params: {
            project: {
              client_id: 100000,
              description: "test for update"
            }
          }), headers: auth_headers(user)
        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to eq("Client must exist")
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :patch, api_v1_project_path(id: project.id), headers: auth_headers(user)
    end

    it "is not be permitted to update an project" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :patch, api_v1_project_path(id: project.id), headers: auth_headers(user)
    end

    it "is not be permitted to update an project" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to update an project" do
      send_request :patch, api_v1_project_path(id: project.id)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
