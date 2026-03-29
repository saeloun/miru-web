# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Cli::Clients#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:cli_token) { CliSession.issue_for(user:, company:).last }
  let!(:client) { create(:client, company:, name: "Solar Client") }
  let!(:project) { create(:project, client:) }

  before do
    create(:employment, company:, user:)
  end

  it "forbids clients access for an employee" do
    user.add_role :employee, company
    create(:project_member, user:, project:)

    send_request :get, api_v1_cli_clients_path, params: { query: "Solar" }, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:forbidden)
  end

  it "returns clients for a book keeper" do
    user.add_role :book_keeper, company

    send_request :get, api_v1_cli_clients_path, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:ok)
    expect(json_response["clients"]).to contain_exactly(include("id" => client.id, "name" => "Solar Client"))
  end
end
