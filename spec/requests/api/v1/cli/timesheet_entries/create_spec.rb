# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Cli::TimesheetEntries#create", type: :request do
  let(:company) { create(:company, plan_tier: "free") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, billable: true, client:) }
  let(:cli_token) { CliSession.issue_for(user:, company:).last }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
  end

  it "creates a timesheet entry for the authenticated user" do
    create(:project_member, project:, user:)

    send_request :post, api_v1_cli_timesheet_entries_path, params: {
      timesheet_entry: {
        project_id: project.id,
        duration_minutes: 90,
        work_date: Date.current.iso8601,
        note: "Pairing on invoice flow",
        bill_status: "unbilled"
      }
    }, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:ok)
    expect(json_response.dig("entry", "project_id")).to eq(project.id)
    expect(json_response.dig("entry", "duration")).to eq(90.0)
    expect(TimesheetEntry.last.user_id).to eq(user.id)
  end

  it "does not allow an employee to create an entry for an unassigned project" do
    send_request :post, api_v1_cli_timesheet_entries_path, params: {
      timesheet_entry: {
        project_id: project.id,
        duration_minutes: 90,
        work_date: Date.current.iso8601
      }
    }, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:not_found)
  end
end
