# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TimeTracking#index", type: :request do
  let(:company1) { create(:company, date_format: "MM-DD-YYYY") }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company1.id) }
  let!(:client1) { create(:client, company: company1, name: "ABC") }
  let!(:client2) { create(:client, company: company1, name: "MNC") }
  let!(:client3) { create(:client, company: company2) }
  let!(:project1) { create(:project, client: client1) }
  let!(:project2) { create(:project, client: client1) }
  let!(:project3) { create(:project, client: client2) }
  let!(:project4) { create(:project, client: client3) }
  let!(:timesheet_entry) do
    create(
      :timesheet_entry,
      user:,
      project: project1,
      work_date: Date.current,
      note: "Tracked from Codex",
      source: "mcp",
      source_metadata: {
        tool: "codex",
        skill: "gstack-qa",
        mcp_server: "github"
      }
    )
  end

  before do
    create(:project_member, user:, project: project1)
    create(:project_member, user:, project: project4)
  end

  context "when user is an admin" do
    let(:today_key) { Date.current.iso8601 }

    before do
      create(:employment, company: company1, user:)
      user.add_role :admin, company1
      sign_in user
      send_request :get, api_v1_time_tracking_index_path, headers: auth_headers(user)
    end

    it "returns success" do
      expect(response).to have_http_status(:ok)
    end

    it "returns all clients of the company" do
      expect(json_response["clients"].pluck("id")).to eq([client1.id, client2.id])
    end

    it "returns all projects of all clients of the company" do
      expected_response = {
        client1.name => [project1.id, project2.id].sort,
        client2.name => [project3.id]
      }
      actual_response = json_response["projects"].transform_values { |projects|
        projects.pluck("id").sort
      }
      expect(actual_response).to eq(expected_response)
    end

    it "includes AI source metadata in time-tracking entries" do
      entry = json_response.dig("entries", today_key).first

      expect(entry["source"]).to eq("mcp")
      expect(entry["source_label"]).to eq("Codex via MCP")
      expect(entry["source_metadata"]).to include(
        "tool" => "codex",
        "skill" => "gstack-qa",
        "mcp_server" => "github"
      )
    end

    it "parses workspace-formatted date params when filtering entries" do
      send_request :get, api_v1_time_tracking_index_path, params: {
        from: Date.current.beginning_of_week(:monday).strftime("%m-%d-%Y"),
        to: Date.current.end_of_week(:monday).strftime("%m-%d-%Y")
      }, headers: auth_headers(user)

      entry = json_response.dig("entries", today_key).first

      expect(entry["note"]).to eq("Tracked from Codex")
      expect(entry["source_label"]).to eq("Codex via MCP")
    end

    it "parses ISO date params when filtering entries" do
      send_request :get, api_v1_time_tracking_index_path, params: {
        from: Date.current.beginning_of_week(:monday).iso8601,
        to: Date.current.end_of_week(:monday).iso8601
      }, headers: auth_headers(user)

      entry = json_response.dig("entries", today_key).first

      expect(entry["note"]).to eq("Tracked from Codex")
      expect(entry["source_label"]).to eq("Codex via MCP")
    end

    it "falls back safely when invalid date params are provided" do
      send_request :get, api_v1_time_tracking_index_path, params: {
        from: "not-a-date",
        to: "still-not-a-date"
      }, headers: auth_headers(user)

      entry = json_response.dig("entries", today_key).first

      expect(entry["note"]).to eq("Tracked from Codex")
      expect(entry["source_label"]).to eq("Codex via MCP")
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company: company1, user:)
      user.add_role :employee, company1
      sign_in user
      send_request :get, api_v1_time_tracking_index_path, headers: auth_headers(user)
    end

    it "returns success" do
      expect(response).to have_http_status(:ok)
    end

    it "returns only those clients of projects to which employee is added" do
      expect(json_response["clients"].pluck("id")).to eq([client1.id])
    end

    it "returns only those projects to which employee is added" do
      expected_response = { client1.name => [project1.id] }
      actual_response = json_response["projects"].transform_values { |projects|
        projects.pluck("id")
      }
      expect(actual_response).to eq(expected_response)
    end

    it "excludes removed project assignments" do
      user.project_members.find_by(project: project1).discard

      send_request :get, api_v1_time_tracking_index_path, headers: auth_headers(user)

      expect(json_response["clients"]).to eq([])
      expect(json_response["projects"]).to be_nil.or eq({})
    end
  end
end
