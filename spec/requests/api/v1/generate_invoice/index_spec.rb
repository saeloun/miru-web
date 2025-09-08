# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::GenerateInvoice#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let!(:project) { create(:project, billable: true, client:) }
  let!(:project_member) { create(:project_member, user:, project:) }
  let!(:timesheet_entry) { create(:timesheet_entry, user:, project:, bill_status: "unbilled") }

  let(:expected_invoice_line_items) do [{
    "timesheet_entry_id": timesheet_entry.id,
    "user_id": user.id,
    "project_id": project.id,
    "first_name": user.first_name,
    "last_name": user.last_name,
    "description": timesheet_entry.note,
    "date": timesheet_entry.work_date,
    "quantity": timesheet_entry.duration,
    "rate": project_member.hourly_rate
  }]
  end

  let(:filter_options) do {
    team_members: [{ "label": user.full_name, "value": user.id }]
  }
  end

  before do
    @search_params = {
      selected_entries: [],
      search_term: timesheet_entry.note,
      page: "1",
      date_range: "custom",
      from: 1.weeks.ago.beginning_of_week,
      to: 1.weeks.ago.end_of_week,
      team_member: [user.id]
    }
    # Search index refresh not needed with PG search
  end

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when no params are passed" do
      it "returns all line_item_entries" do
        send_request :get, api_v1_generate_invoice_index_path(client_id: client.id),
          headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
        expect(json_response["new_line_item_entries"]).to eq(JSON.parse(expected_invoice_line_items.to_json))
      end
    end

    context "when only selected entries param is passed" do
      it "returns no entries" do
        send_request :get, api_v1_generate_invoice_index_path(client_id: client.id), params: {
          selected_entries: [timesheet_entry.id]
        }, headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
        expect(json_response["new_line_item_entries"]).to eq([])
      end
    end

    context "when user search with date filter" do
      it "returns new line with filter" do
        send_request :get, api_v1_generate_invoice_index_path(client_id: client.id), params: {
          date_range: "custom",
          from: 1.weeks.ago.beginning_of_week,
          to: 1.weeks.ago.end_of_week
        }, headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
      end
    end

    context "when user search with team member filter" do
      it "returns new line with team member filter" do
        send_request :get, api_v1_generate_invoice_index_path(client_id: client.id), params: {
          team_member: user.id
        }, headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
        expect(json_response["new_line_item_entries"].first["first_name"]).to eq(user.first_name)
      end
    end

    context "when user search with search term" do
      it "returns new line with search term having first name" do
        send_request :get, api_v1_generate_invoice_index_path(client_id: client.id), params: {
          search_term: timesheet_entry.note
        }, headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
      end
    end

    context "when user search with empty search term" do
      it "returns all entries" do
        send_request :get, api_v1_generate_invoice_index_path(client_id: client.id), params: {
          search_term: " "
        }, headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
        expect(json_response["new_line_item_entries"]).to eq(JSON.parse(expected_invoice_line_items.to_json))
      end
    end

    context "when user search with multiple filters at once" do
     it "returns all expected entries" do
       send_request :get, api_v1_generate_invoice_index_path(client_id: client.id), params: {
         params: @search_params
       }, headers: auth_headers(user)
       expect(response).to have_http_status(:ok)
       expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
       expect(json_response["new_line_item_entries"]).to eq(JSON.parse(expected_invoice_line_items.to_json))
     end
   end

    context "when the timesheet entry is already added to another draft invoice" do
     it "returns empty new_line_item_entries result" do
       create(:invoice_line_item, timesheet_entry_id: timesheet_entry.id)
       send_request :get, api_v1_generate_invoice_index_path(client_id: client.id), params: {
         params: @search_params
       }, headers: auth_headers(user)
       expect(response).to have_http_status(:ok)
       expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
       expect(json_response["new_line_item_entries"]).to be_empty
     end
   end
  end
end
