# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Projects::Search#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let!(:project) { create(:project, client:) }
  let(:project_member) { create(:project_member, user:, project:, hourly_rate: 5000) }

  # No setup needed - PG search doesn't require indexing

  context "when user search with a valid search term" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "when user search with project name" do
      it "returns list of projects matching the search term" do
      send_request :get, "/internal_api/v1/projects/search?search_term=#{project.name}",
        headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json_response["projects"].first).to eq(
        {
          "id" => project.id, "name" => project.name,
          "client_name" => client.name
        })
    end
    end
  end

  context "when user search with an invalid search term" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      create_list(:timesheet_entry, 5, user:, project:)
    end

    describe "when user search with an invalid search term" do
      it "returns list of projects matching the search term" do
        send_request :get, "/internal_api/v1/projects/search?search_term=invalid", headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
      end
    end
  end

  context "when user search for deleted project" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      create_list(:timesheet_entry, 5, user:, project:)
      project.discard!
    end

    it "returns no result" do
      send_request :get, "/internal_api/v1/projects/search?search_term=#{project.name}",
        headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
    end
  end
end
