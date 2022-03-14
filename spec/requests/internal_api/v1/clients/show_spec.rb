# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Clients#show", type: :request do
  let (:company) { create(:company) }
  let (:user) { create(:user, current_workspace_id: company.id) }
  let!(:client_1) { create(:client, company: company) }
  let!(:client_2) { create(:client, company: company) }
  let!(:project_1) { create(:project, client: client_1) }
  let!(:project_2) { create(:project, client: client_2) }
  let!(:project_1_timesheet_entry) { create_list(:timesheet_entry, 5, user: user, project: project_1) }
  let!(:project_2_timesheet_entry) { create_list(:timesheet_entry, 5, user: user, project: project_2) }


  context "When user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      create(:project_member, user_id: user.id, project_id: project_1.id)
      create(:project_member, user_id: user.id, project_id: project_2.id)
      user.add_role :admin, company
      sign_in user
      send_request :get, internal_api_v1_client_path(client_1)
    end

    it "should return the total hours logged for each projects for a client" do
      client_details = { "id" => client_1.id, "name" => client_1.name, "email" => client_1.email }
      project_details = client_1.hours_logged("week")
      total_hours = (project_details.map { |project| project["hour_spend"] }).sum
      expect(response).to have_http_status(:ok)
      expect(json_response["project_details"]).to eq(project_details)
      expect(json_response["client"]).to eq(client_details)
      expect(json_response["total_hours"]).to eq(total_hours)
    end
  end

  context "When user is employee" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_clients_path
    end

    it "should not be permitted to view time entry report" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "should not be permitted to view time entry report" do
      send_request :get, internal_api_v1_reports_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
