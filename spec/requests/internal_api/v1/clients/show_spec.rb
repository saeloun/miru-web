# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Clients#show", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client_1) { create(:client, company:) }
  let(:project_1) { create(:project, client: client_1) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      create(:project_member, user:, project_id: project_1.id)
      user.add_role :admin, company
      sign_in user
      create_list(:timesheet_entry, 5, user:, project: project_1)
      send_request :get, internal_api_v1_client_path(client_1), headers: auth_headers(user)
    end

    context "when time_frame is week" do
      let(:time_frame) { "week" }

      it "returns the total hours logged for a client in that week" do
        client_details = {
          id: client_1.id, name: client_1.name, email: client_1.email, phone: client_1.phone,
          address: client_1.current_address, logo: "", currency: client_1.currency
        }
        project_details = client_1.project_details(time_frame)
        total_minutes = (project_details.pluck(:minutes_spent)).sum
        overdue_outstanding_amount = client_1.client_overdue_and_outstanding_calculation
        expect(response).to have_http_status(:ok)
        expect(json_response["project_details"]).to eq(JSON.parse(project_details.to_json))
        expect(json_response["client_details"]).to eq(JSON.parse(client_details.to_json))
        expect(json_response["total_minutes"]).to eq(total_minutes)
        expect(json_response["overdue_outstanding_amount"]).to eq(JSON.parse(overdue_outstanding_amount.to_json))
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_client_path(client_1), headers: auth_headers(user)
    end

    it "is not permitted to view client details" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :get, internal_api_v1_client_path(client_1), headers: auth_headers(user)
    end

    it "is not permitted to view client details" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view client details" do
      send_request :get, internal_api_v1_client_path(client_1)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
