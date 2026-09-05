# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Imports#show", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:cli_token) { CliSession.issue_for(user:, company:).last }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
  end

  it "shows an import from the current company" do
    data_import = create(:data_import, company:, user:, summary: { "rows" => 12 })

    send_request :get, api_v1_import_path(data_import), headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:ok)
    expect(json_response).to include("id" => data_import.id, "summary" => { "rows" => 12 })
  end

  it "returns not found for another company's import" do
    other_company = create(:company)
    other_user = create(:user, current_workspace_id: other_company.id)
    data_import = create(:data_import, company: other_company, user: other_user)

    send_request :get, api_v1_import_path(data_import), headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:not_found)
  end

  it "forbids an employee from showing an import" do
    user.remove_role :admin, company
    user.add_role :employee, company
    data_import = create(:data_import, company:, user:)

    send_request :get, api_v1_import_path(data_import), headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:forbidden)
  end
end
