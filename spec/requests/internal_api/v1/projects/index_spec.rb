# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Projects#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project_1) { create(:project, client:) }
  let(:project_2) { create(:project, client:) }
  let(:time_frame) { "week" }

  context "when the user is an admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
      create_list(:timesheet_entry, 5, user:, project: project_1)
      create_list(:timesheet_entry, 5, user:, project: project_2)
      send_request :get, internal_api_v1_projects_path
    end

    context "when time_frame is week" do
      it "returns the list of projects and minutes logged" do
        projects = user.current_workspace.projects.kept.map do |project|
          {
            id: project.id, name: project.name, client: { name: project.client.name },
            isBillable: project.billable, minutesSpent: project.total_hours_logged(time_frame)
          }
        end
        clients = user.current_workspace.clients.kept.map do |client|
          {
            id: client.id, name: client.name
          }
        end
        expect(response).to have_http_status(:ok)
        expect(json_response["projects"]).to eq(JSON.parse(projects.to_json))
        expect(json_response["clients"]).to eq(JSON.parse(clients.to_json))
      end
    end
  end

  context "when the user is an employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_projects_path
    end

    context "when time_frame is week" do
      it "returns the list of projects and minutes logged" do
        projects = user.current_workspace.projects.kept.map do |project|
          {
            id: project.id, name: project.name, client: { name: project.client.name },
            isBillable: project.billable, minutesSpent: project.total_hours_logged(time_frame)
          }
        end
        clients = user.current_workspace.clients.kept.map do |client|
          {
            id: client.id, name: client.name
          }
        end
        expect(response).to have_http_status(:ok)
        expect(json_response["projects"]).to eq(JSON.parse(projects.to_json))
        expect(json_response["clients"]).to eq(JSON.parse(clients.to_json))
      end
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view project" do
      send_request :get, internal_api_v1_projects_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
