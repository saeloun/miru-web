# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::GeneratInvoice#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let!(:project) { create(:project, client:) }
  let!(:project_member) { create(:project_member, user:, project:) }
  let!(:timesheet_entry) { create(:timesheet_entry, user:, project:) }

  let(:expected_invoice_line_items) do [{
    "id": timesheet_entry.id,
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
  end

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      TimesheetEntry.search_index.refresh
    end

    context "when no params are passed" do
      it "returns all line_item_entries" do
        send_request :get, internal_api_v1_generate_invoice_index_path(client_id: client.id)
        expect(response).to have_http_status(:ok)
        expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
        expect(json_response["new_invoice_line_items"]).to eq(JSON.parse(expected_invoice_line_items.to_json))
      end
    end

    context "when only selected entries param is passed" do
      it "returns no entries" do
        send_request :get, internal_api_v1_generate_invoice_index_path(client_id: client.id), params: {
          selected_entries: [timesheet_entry.id]
        }
        expect(response).to have_http_status(:ok)
        expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
        expect(json_response["new_invoice_line_items"]).to eq([])
      end
    end

    context "when user search with 'this week' date filter" do
      it "returns new line with 'this week' filter" do
        send_request :get, internal_api_v1_generate_invoice_index_path(client_id: client.id), params: {
          date_range: "this_week"
        }
        expect(response).to have_http_status(:ok)
        expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
        expect(json_response["new_invoice_line_items"].first["first_name"]).to eq(user.first_name)
      end
    end

    context "when user search with team member filter" do
      it "returns new line with team member filter" do
        send_request :get, internal_api_v1_generate_invoice_index_path(client_id: client.id), params: {
          team_member: user.id
        }
        expect(response).to have_http_status(:ok)
        expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
        expect(json_response["new_invoice_line_items"].first["first_name"]).to eq(user.first_name)
      end
    end

    context "when user search with search term" do
      it "returns new line with search term having first name" do
        send_request :get, internal_api_v1_generate_invoice_index_path(client_id: client.id), params: {
          search_term: timesheet_entry.note
        }
        expect(response).to have_http_status(:ok)
        expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
        expect(json_response["new_invoice_line_items"].first["first_name"]).to eq(user.first_name)
      end
    end

    context "when user search with empty search term" do
      it "returns all entries" do
        send_request :get, internal_api_v1_generate_invoice_index_path(client_id: client.id), params: {
          search_term: " "
        }
        expect(response).to have_http_status(:ok)
        expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
        expect(json_response["new_invoice_line_items"]).to eq(JSON.parse(expected_invoice_line_items.to_json))
      end
    end

    context "when user search with multiple filters at once" do
     it "returns all expected entries" do
       send_request :get, internal_api_v1_generate_invoice_index_path(client_id: client.id), params: {
         params: @search_params
       }
       expect(response).to have_http_status(:ok)
       expect(json_response["filter_options"]).to eq(JSON.parse(filter_options.to_json))
       expect(json_response["new_invoice_line_items"]).to eq(JSON.parse(expected_invoice_line_items.to_json))
     end
   end
  end
end
