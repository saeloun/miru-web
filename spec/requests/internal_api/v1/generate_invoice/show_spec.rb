# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::GeneratInvoice#show", type: :request do
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
      send_request :get, internal_api_v1_generate_invoice_path(client)
    end

    context "when no entries are selected" do
      let(:selected_entries) { [] }

      it "returns the all new_line_item_entries" do
        new_line_item_entries = client.new_line_item_entries(selected_entries)
        expect(response).to have_http_status(:ok)
        expect(json_response["new_line_item_entries"]).to eq(JSON.parse(new_line_item_entries.to_json))
      end
    end

    context "when some entries are selected" do
      let(:selected_entries) { [1, 2] }

      it "returns the all new_line_item_entries except the one whcih are selected" do
        new_line_item_entries = client.new_line_item_entries(selected_entries)
        expect(response).to have_http_status(:ok)
        expect(json_response["new_line_item_entries"]).to eq(JSON.parse(new_line_item_entries.to_json))
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_generate_invoice_index_path
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
