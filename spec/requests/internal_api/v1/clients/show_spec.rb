# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Clients#show", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client_1) { create(:client, company:) }
  let(:project_1) { create(:project, client: client_1) }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      create(:project_member, user:, project_id: project_1.id)
      user.add_role :admin, company
      sign_in user
      create_list(:timesheet_entry, 5, user:, project: project_1)
      send_request :get, internal_api_v1_client_path(client_1)
    end

    context "when time_frame is week" do
      let(:time_frame) { "week" }

      it "returns the total hours logged for a client in that week" do
        client_details = { id: client_1.id, name: client_1.name, email: client_1.email }
        project_details = client_1.project_details(time_frame)
        total_minutes = (project_details.map { |project| project[:minutes_spent] }).sum
        expect(response).to have_http_status(:ok)
        expect(json_response["project_details"]).to eq(JSON.parse(project_details.to_json))
        expect(json_response["client_details"]).to eq(JSON.parse(client_details.to_json))
        expect(json_response["total_minutes"]).to eq(total_minutes)
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_clients_path
    end

    it "is not permitted to view time entry report" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view time entry report" do
      send_request :get, internal_api_v1_reports_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
