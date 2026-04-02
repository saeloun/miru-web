# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices::LineItems#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let!(:project) { create(:project, billable: true, client:) }
  let!(:project_member) { create(:project_member, user:, project:) }
  let!(:timesheet_entry) { create(:timesheet_entry, user:, project:, bill_status: "unbilled") }

  let(:expected_invoice_line_items) do
    [{
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

  let(:filter_options) do
    {
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
  end

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "returns all line_item_entries when no params are passed" do
      send_request :get, api_v1_line_items_invoices_path(client_id: client.id),
        headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
      expect(json_response["new_line_item_entries"]).to eq(JSON.parse(expected_invoice_line_items.to_json))
    end

    it "returns no entries when selected entries are passed" do
      send_request :get, api_v1_line_items_invoices_path(client_id: client.id), params: {
        selected_entries: [timesheet_entry.id]
      }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
      expect(json_response["new_line_item_entries"]).to eq([])
    end

    it "filters by date range" do
      send_request :get, api_v1_line_items_invoices_path(client_id: client.id), params: {
        date_range: "custom",
        from: 1.weeks.ago.beginning_of_week,
        to: 1.weeks.ago.end_of_week
      }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
    end

    it "filters by team member" do
      send_request :get, api_v1_line_items_invoices_path(client_id: client.id), params: {
        team_member: user.id
      }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
      expect(json_response["new_line_item_entries"].first["first_name"]).to eq(user.first_name)
    end

    it "filters by search term" do
      send_request :get, api_v1_line_items_invoices_path(client_id: client.id), params: {
        search_term: timesheet_entry.note
      }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
    end

    it "returns all entries for blank search terms" do
      send_request :get, api_v1_line_items_invoices_path(client_id: client.id), params: {
        search_term: " "
      }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
      expect(json_response["new_line_item_entries"]).to eq(JSON.parse(expected_invoice_line_items.to_json))
    end

    it "supports combined filters" do
      send_request :get, api_v1_line_items_invoices_path(client_id: client.id), params: {
        params: @search_params
      }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
      expect(json_response["new_line_item_entries"]).to eq(JSON.parse(expected_invoice_line_items.to_json))
    end

    it "excludes entries already used by another draft invoice" do
      create(:invoice_line_item, invoice: create(:invoice, client:, company: client.company), timesheet_entry:)

      send_request :get, api_v1_line_items_invoices_path(client_id: client.id), params: {
        params: @search_params
      }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
      expect(json_response["new_line_item_entries"]).to be_empty
    end

    it "returns not found when the client does not belong to the current workspace" do
      other_company = create(:company)
      other_client = create(:client, company: other_company)

      send_request :get,
        api_v1_line_items_invoices_path(client_id: other_client.id),
        headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
      expect(json_response["error"]).to eq("Client not found")
    end
  end
end
