# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Project#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }

  context "when the user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "#destroy" do
      it "updates project successfully" do
        send_request :delete, api_v1_project_path(id: project.id), headers: auth_headers(user)
        expect(response).to be_successful
      end
    end
  end

  context "when the user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :delete, api_v1_project_path(id: project.id), headers: auth_headers(user)
    end

    it "is not be permitted to destroy an project" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when the user is an book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :delete, api_v1_project_path(id: project.id), headers: auth_headers(user)
    end

    it "is not be permitted to destroy an project" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to update an project" do
      send_request :delete, api_v1_project_path(id: project.id)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
