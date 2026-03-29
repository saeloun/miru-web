# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Cli::TimesheetEntries#destroy", type: :request do
  let(:company) { create(:company, plan_tier: "free") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, billable: true, client:) }
  let(:timesheet_entry) { create(:timesheet_entry, user:, project:) }
  let(:cli_token) { CliSession.issue_for(user:, company:).last }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
    create(:project_member, project:, user:)
  end

  it "deletes one of the authenticated user's timesheet entries" do
    send_request :delete, api_v1_cli_timesheet_entry_path(timesheet_entry), headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:ok)
    expect(json_response["notice"]).to eq(I18n.t("timesheet_entry.destroy.message"))
    expect(timesheet_entry.reload.discarded?).to be(true)
  end

  it "does not allow deleting another user's timesheet entry" do
    other_user = create(:user, current_workspace_id: company.id)
    create(:employment, company:, user: other_user)
    other_entry = create(:timesheet_entry, user: other_user, project:)

    send_request :delete, api_v1_cli_timesheet_entry_path(other_entry), headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:not_found)
  end
end
