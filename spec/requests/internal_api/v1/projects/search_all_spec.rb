# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Projects::SearchAll#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let(:project_member) { create(:project_member, user:, project:, hourly_rate: 5000) }

  context "when user search with a valid search term" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      create_list(:timesheet_entry, 5, user:, project:)
    end

    describe "when user search with project name" do
      it "returns list of projects matching the search term" do
        send_request :get, "/internal_api/v1/projects/search_all?search_term=#{project.name.first}"
        expect(response).to have_http_status(:ok)
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
        send_request :get, "/internal_api/v1/projects/search_all?search_term=invalid"
        expect(response).to have_http_status(:ok)
      end
    end
  end
end
