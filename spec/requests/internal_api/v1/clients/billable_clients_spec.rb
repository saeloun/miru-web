# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Clients#billable_clients", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client_1) { create(:client, company:) }
  let(:client_2) { create(:client, company:) }
  let(:client_3) { create(:client, company:, name: "john") }
  let(:project_1) { create(:project, billable: true, client: client_1) }
  let(:project_2) { create(:project, billable: true, client: client_2) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      create_list(:timesheet_entry, 5, user:, project: project_1)
      create_list(:timesheet_entry, 5, user:, project: project_2)
      send_request :get, internal_api_v1_clients_path, headers: auth_headers(user)
    end

    it "returns only clients having billable projects" do
      expect(json_response["client_details"].pluck("id")).to include(client_1.id, client_2.id)
    end

    it "does not return clients having no billable projects" do
      resp = {
        "id" => client_3.id,
        "name" => client_3.name
      }
      expect(json_response["client_details"]).not_to include(resp)
    end
  end
end
