# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Clients#index", type: :request do
  let (:company) { create(:company) }
  let (:user) { create(:user, current_workspace_id: company.id) }
  let (:client_1) { create(:client, company: company) }
  let (:client_2) { create(:client, company: company) }
  let (:project_1) { create(:project, client: client_1) }
  let (:project_2) { create(:project, client: client_2) }


  context "when user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
      sign_in user
      create_list(:timesheet_entry, 5, user: user, project: project_1)
      create_list(:timesheet_entry, 5, user: user, project: project_2)
      send_request :get, internal_api_v1_clients_path
    end

    context "when time_frame is week" do
      let (:time_frame) { "last_week" }

      it "should return the total hours logged for a Company in the last_week" do
        client_details = user.current_workspace.clients.kept.map { |client| { id: client.id, name: client.name, email: client.email, minutes_spent: client.total_hours_logged(time_frame) } }
        total_hours = (client_details.map { |client| client[:minutes_spent] }).sum
        expect(response).to have_http_status(:ok)
        expect(json_response["client_details"]).to eq(JSON.parse(client_details.to_json))
        expect(json_response["total_hours"]).to eq(JSON.parse(total_hours.to_json))
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
