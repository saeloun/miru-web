# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Projects#show", type: :request do
  let (:company) { create(:company) }
  let (:user) { create(:user, current_workspace_id: company.id) }
  let (:client) { create(:client, company: company) }
  let (:project) { create(:project, client: client) }
  let (:project_member) { create(:project_member, user_id: user.id, project_id: project.id, hourly_rate: 5000) }

  context "when user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
      sign_in user
      create_list(:timesheet_entry, 5, user: user, project: project)
      send_request :get, internal_api_v1_project_path(project)
    end

    context "when time_frame is week" do
      let (:time_frame) { "week" }

      it "returns the project_details, project_team_member_details, project_total_minutes_logged for a project in that week" do
        project_details = { id: project.id, name: project.name, billable_status: project.billable }
        project_team_member_details = project.project_team_member_details(time_frame)
        project_total_minutes_logged = (project_team_member_details.map { |user_details| user_details[:minutes_logged] }).sum
        expect(response).to have_http_status(:ok)
        expect(json_response["project_details"]).to eq(JSON.parse(project_details.to_json))
        expect(json_response["project_team_member_details"]).to eq(JSON.parse(project_team_member_details.to_json))
        expect(json_response["project_total_minutes_logged"]).to eq(project_total_minutes_logged)
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
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
