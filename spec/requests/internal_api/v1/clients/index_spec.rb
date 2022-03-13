# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Clients#index", type: :request do
  let (:company) { create(:company) }
  let (:user) { create(:user, current_workspace_id: company.id) }
  let!(:client_1) { create(:client, company: company) }
  let!(:client_2) { create(:client, company: company) }
  let!(:project_1) { create(:project, client: client_1) }
  let!(:project_2) { create(:project, client: client_2) }

  5.times do
    let!(:project_1_timesheet_entry) { create(:timesheet_entry, user: user, project: project_1) }
    let!(:project_2_timesheet_entry) { create(:timesheet_entry, user: user, project: project_2) }
  end

  context "When user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
      sign_in user
      send_request :get, internal_api_v1_clients_path
    end

    it "should return the total hours logged for each clients in a Company" do
      client_hours = user.current_workspace.clients.kept.map { |client| { "id" => client.id, "name" => client.name, "email" => client.email, "hours_spend" => client.project_total_hours("week") } }
      expect(response).to have_http_status(:ok)
      expect(json_response["client_hours"]).to eq(client_hours)
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
