# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Cli::Capabilities#show", type: :request do
  let(:company) { create(:company, plan_tier: "free") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:issued_cli_session) { CliSession.issue_for(user:, company:) }
  let(:cli_token) { issued_cli_session.last }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
  end

  it "returns the available commands for cli-authenticated users" do
    send_request :get, api_v1_cli_capabilities_path, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:ok)
    expect(json_response["commands"].pluck("name")).to include(
      "time create", "time list", "project list", "invoice list", "invoice show", "payment list", "payment show"
    )
    expect(
      json_response["commands"].find { |command| command["name"] == "time create" }
    ).to include("supports_source_metadata" => true)
    expect(
      json_response["commands"].find { |command| command["name"] == "time update" }
    ).to include("supports_source_metadata" => true)
  end
end
