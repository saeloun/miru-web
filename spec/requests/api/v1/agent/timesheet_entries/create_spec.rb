# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Agent::TimesheetEntries#create", type: :request do
  let(:company) { create(:company, plan_tier: "free") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, billable: true, client:) }
  let(:agent) { create(:agent, company:, user:, default_project: project, provider: "codex") }
  let(:issued_key) { AgentKey.issue_for(agent:, name: "Primary Key", created_by: user) }
  let(:agent_token) { issued_key.last }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
  end

  it "creates a reviewable timesheet entry for the authenticated agent" do
    send_request :post, api_v1_agent_timesheet_entries_path, params: {
      timesheet_entry: {
        duration_minutes: 60,
        work_date: Date.current.iso8601,
        note: "Generated invoice follow-up draft",
        source_metadata: {
          tool: "claude-code",
          skill: "gstack-review",
          pii: "drop-me"
        },
        proof_url: "https://example.test/runs/123",
        proof_metadata: {
          transcript_url: "https://example.test/transcripts/123",
          repo: "saeloun/miru-web"
        },
        external_run_id: "run_123",
        external_session_id: "session_123"
      }
    }, headers: { "Authorization" => "Bearer #{agent_token}" }

    expect(response).to have_http_status(:ok)
    entry = TimesheetEntry.last

    expect(entry.user_id).to eq(user.id)
    expect(entry.agent_id).to eq(agent.id)
    expect(entry.project_id).to eq(project.id)
    expect(entry.bill_status).to eq("unbilled")
    expect(entry.review_status).to eq("pending_review")
    expect(entry.source).to eq("automation")
    expect(entry.source_metadata).to eq(
      "tool" => "claude-code",
      "skill" => "gstack-review"
    )
    expect(entry.proof_metadata).to eq(
      "transcript_url" => "https://example.test/transcripts/123",
      "repo" => "saeloun/miru-web"
    )
    expect(json_response.dig("entry", "agent_name")).to eq(agent.name)
    expect(json_response.dig("entry", "review_status")).to eq("pending_review")
  end

  it "rejects revoked agent keys" do
    issued_key.first.revoke!

    send_request :post, api_v1_agent_timesheet_entries_path, params: {
      timesheet_entry: {
        project_id: project.id,
        duration_minutes: 30,
        work_date: Date.current.iso8601,
        bill_status: "billed"
      }
    }, headers: { "Authorization" => "Bearer #{agent_token}" }

    expect(response).to have_http_status(:unauthorized)
  end

  it "returns unauthorized for missing or malformed tokens" do
    send_request :post, api_v1_agent_timesheet_entries_path, params: {
      timesheet_entry: {
        project_id: project.id,
        duration_minutes: 30,
        work_date: Date.current.iso8601
      }
    }
    expect(response).to have_http_status(:unauthorized)

    send_request :post, api_v1_agent_timesheet_entries_path, params: {
      timesheet_entry: {
        project_id: project.id,
        duration_minutes: 30,
        work_date: Date.current.iso8601
      }
    }, headers: { "Authorization" => "Bearer invalid-token" }
    expect(response).to have_http_status(:unauthorized)
  end

  it "returns not found when no explicit or default project is available" do
    agent.update!(default_project: nil)

    send_request :post, api_v1_agent_timesheet_entries_path, params: {
      timesheet_entry: {
        duration_minutes: 30,
        work_date: Date.current.iso8601
      }
    }, headers: { "Authorization" => "Bearer #{agent_token}" }

    expect(response).to have_http_status(:not_found)
  end

  it "returns unauthorized when the backing user is inactive" do
    user.discard

    send_request :post, api_v1_agent_timesheet_entries_path, params: {
      timesheet_entry: {
        project_id: project.id,
        duration_minutes: 30,
        work_date: Date.current.iso8601
      }
    }, headers: { "Authorization" => "Bearer #{agent_token}" }

    expect(response).to have_http_status(:unauthorized)
  end
end
