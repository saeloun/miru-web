# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Projects#show", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let(:project_member) { create(:project_member, user:, project:, hourly_rate: 5000) }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
      create_list(:timesheet_entry, 5, user:, project:)
      send_request :get, internal_api_v1_project_path(project)
    end

    context "when time_frame is week" do
      let(:time_frame) { "week" }

      it "returns the project id, name, billable, client, members, total_minutes_logged for project in week" do
        project_team_member_details = project.project_team_member_details(time_frame)
        project_details = {
          id: project.id,
          name: project.name,
          is_billable: project.billable,
          client: { name: project.client.name },
          members: project_team_member_details,
          total_minutes_logged: (
                              project_team_member_details.map { |user_details|user_details[:minutes_logged] }
                            ).sum
        }
        expect(response).to have_http_status(:ok)
        expect(json_response["project_details"]).to eq(JSON.parse(project_details.to_json))
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_project_path(project)
    end

    it "is not permitted to view project details" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view project details" do
      send_request :get, internal_api_v1_project_path(project)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
