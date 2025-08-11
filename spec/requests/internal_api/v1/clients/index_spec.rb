# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Clients#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client_1) { create(:client, company:) }
  let(:client_2) { create(:client, company:) }
  let(:client_3) { create(:client, company:, name: "john") }

  let(:project_1) { create(:project, client: client_1) }
  let(:project_2) { create(:project, client: client_2) }
  let(:time_frame) { "week" }

  # No setup needed - PG search doesn't require indexing

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      create_list(:timesheet_entry, 5, user:, project: project_1)
      create_list(:timesheet_entry, 5, user:, project: project_2)
      send_request :get, internal_api_v1_clients_path, headers: auth_headers(user)
    end

    context "when time_frame is week" do
      let(:client_details) do
        user.current_workspace.clients.kept.map do |client|
          {
            id: client.id, name: client.name, email: client.email, phone: client.phone, address: client.current_address,
            minutes_spent: client.total_hours_logged(time_frame), logo: "", currency: client.currency
          }
        end
      end
      let(:total_minutes) do
        user.current_workspace.clients.kept.reduce(0) do |sum, client|
          sum + client.total_hours_logged(time_frame)
        end
      end

      it "returns the total hours logged for a Company in the last_week" do
        overdue_outstanding_amount = user.current_workspace.overdue_and_outstanding_and_draft_amount
        expect(response).to have_http_status(:ok)

        expect(json_response["client_details"]).to match_array(JSON.parse(client_details.to_json))
        expect(json_response["total_minutes"]).to eq(total_minutes)
        expect(json_response["overdue_outstanding_amount"]).to eq(JSON.parse(overdue_outstanding_amount.to_json))
      end
    end

    context "for search" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user
        send_request :get, internal_api_v1_clients_path, params: { query: client_1.name }, headers: auth_headers(user)
      end

      it "finds specific client by name" do
        client_details = [{
          id: client_1.id, name: client_1.name, email: client_1.email, phone: client_1.phone,
          address: client_1.current_address, minutes_spent: client_1.total_hours_logged(time_frame),
          logo: "", currency: client_1.currency
        }]
        expect(response).to have_http_status(:ok)
        expect(json_response["client_details"]).to eq(JSON.parse(client_details.to_json))
      end
    end

    it "returns all the clients when query params are empty" do
      client_details = [{
        id: client_1.id, name: client_1.name, email: client_1.email, phone: client_1.phone,
        address: client_1.current_address, minutes_spent: client_1.total_hours_logged(time_frame),
        logo: "", currency: client_1.currency
      }, id: client_2.id, name: client_2.name, email: client_2.email, phone: client_2.phone,
         address: client_2.current_address, minutes_spent: client_2.total_hours_logged(time_frame),
         logo: "", currency: client_2.currency
      ]
      expect(response).to have_http_status(:ok)
      expect(json_response["client_details"]).to eq(JSON.parse(client_details.to_json))
    end
  end

  context "when user is an employee" do
    let(:time_frame) { "last_week" }

    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      create_list(:timesheet_entry, 5, user:, project: project_1)
      create_list(:timesheet_entry, 5, user:, project: project_2)
      send_request :get, internal_api_v1_clients_path, params: {
        time_frame:
      }, headers: auth_headers(user)
    end

    context "when time_frame is week" do
      it "returns the total hours logged for a Company in the last_week" do
        client_details = user.current_workspace.clients.kept.map do |client|
          {
            id: client.id, name: client.name, email: client.email, phone: client.phone, address: client.current_address,
            minutes_spent: client.total_hours_logged(time_frame), logo: "", currency: client.currency
          }
        end
        total_minutes = (client_details.pluck(:minutes_spent)).sum
        overdue_outstanding_amount = user.current_workspace.overdue_and_outstanding_and_draft_amount
        expect(response).to have_http_status(:ok)
        expect(json_response["client_details"]).to match_array(JSON.parse(client_details.to_json))
        expect(json_response["total_minutes"]).to eq(JSON.parse(total_minutes.to_json))
        expect(json_response["overdue_outstanding_amount"]).to eq(JSON.parse(overdue_outstanding_amount.to_json))
      end
    end
  end

  context "when user is a book keeper" do
    let(:time_frame) { "last_week" }

    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      create_list(:timesheet_entry, 5, user:, project: project_1)
      create_list(:timesheet_entry, 5, user:, project: project_2)
      send_request :get, internal_api_v1_clients_path, params: {
        time_frame:
      }, headers: auth_headers(user)
    end

    it "is not be permitted to access client" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view clients" do
      send_request :get, internal_api_v1_clients_path, params: {
        time_frame:
      }
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
