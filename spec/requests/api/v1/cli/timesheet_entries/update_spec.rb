# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Cli::TimesheetEntries#update", type: :request do
  let(:company) { create(:company, plan_tier: "free") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, billable: true, client:) }
  let(:other_project) { create(:project, billable: true, client:) }
  let(:timesheet_entry) { create(:timesheet_entry, user:, project:, work_date: Date.current - 1.day, duration: 30) }
  let(:cli_token) { CliSession.issue_for(user:, company:).last }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
    create(:project_member, project:, user:)
    create(:project_member, project: other_project, user:)
  end

  it "updates one of the authenticated user's timesheet entries" do
    send_request :patch, api_v1_cli_timesheet_entry_path(timesheet_entry), params: {
      timesheet_entry: {
        project_id: other_project.id,
        duration_minutes: 45,
        work_date: Date.current.iso8601,
        note: "Updated from CLI",
        bill_status: "unbilled"
      }
    }, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:ok)
    expect(json_response.dig("entry", "project_id")).to eq(other_project.id)
    expect(json_response.dig("entry", "duration")).to eq(45.0)
    expect(timesheet_entry.reload.note).to eq("Updated from CLI")
    expect(timesheet_entry.reload.source).to eq("cli")
  end

  it "updates AI source metadata on an existing timesheet entry" do
    send_request :patch, api_v1_cli_timesheet_entry_path(timesheet_entry), params: {
      timesheet_entry: {
        project_id: other_project.id,
        duration_minutes: 45,
        work_date: Date.current.iso8601,
        note: "Updated from Codex",
        bill_status: "unbilled",
        source_metadata: {
          tool: "claude-code",
          skill: "gstack-review"
        }
      }
    }, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:ok)
    expect(json_response.dig("entry", "source_label")).to eq("Claude Code via Automation")
    expect(timesheet_entry.reload.source_metadata).to include(
      "tool" => "claude-code",
      "skill" => "gstack-review"
    )
  end

  it "does not allow updating another user's timesheet entry" do
    other_user = create(:user, current_workspace_id: company.id)
    create(:employment, company:, user: other_user)
    other_entry = create(:timesheet_entry, user: other_user, project:)

    send_request :patch, api_v1_cli_timesheet_entry_path(other_entry), params: {
      timesheet_entry: {
        project_id: project.id,
        duration_minutes: 15,
        work_date: Date.current.iso8601
      }
    }, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:not_found)
  end
end
