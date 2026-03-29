# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Cli::Sessions#destroy", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:cli_token) { CliSession.issue_for(user:, company:).last }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
  end

  it "revokes the current cli session" do
    send_request :delete, api_v1_cli_session_path, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:ok)
    expect(CliSession.active.count).to eq(0)
  end
end
