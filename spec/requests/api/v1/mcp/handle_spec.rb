# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::MCP#handle", type: :request do
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:cli_token) { CliSession.issue_for(user:, company:).last }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
  end

  describe "pro entitlement gate" do
    let(:company) { create(:company, plan_tier: "free") }

    it "returns forbidden for free workspaces" do
      post mcp_path, params: initialize_payload.to_json, headers: mcp_headers(cli_token:, mcp_method: "initialize")

      expect(response).to have_http_status(:forbidden)
      expect(json_response.dig("error", "data", "error")).to eq("forbidden_feature")
    end
  end

  describe "feature flag gate" do
    let(:company) { create(:company, plan_tier: "paid") }

    around do |example|
      original = ENV["MCP_SERVER_ENABLED"]
      ENV["MCP_SERVER_ENABLED"] = "false"
      example.run
      ENV["MCP_SERVER_ENABLED"] = original
    end

    it "returns not found when MCP is disabled" do
      post mcp_path, params: initialize_payload.to_json, headers: mcp_headers(cli_token:, mcp_method: "initialize")

      expect(response).to have_http_status(:not_found)
      expect(json_response.dig("error", "code")).to eq(-32004)
      expect(json_response.dig("error", "data", "error")).to eq("feature_disabled")
    end

    it "returns nil jsonrpc id for non-POST requests" do
      get mcp_path, headers: mcp_headers(cli_token:, mcp_method: "initialize")

      expect(response).to have_http_status(:not_found)
      expect(json_response["id"]).to be_nil
    end

    it "returns nil jsonrpc id for non-object JSON bodies" do
      post mcp_path, params: [{ jsonrpc: "2.0", id: "batch-1", method: "initialize" }].to_json, headers: mcp_headers(cli_token:, mcp_method: "initialize")

      expect(response).to have_http_status(:not_found)
      expect(json_response["id"]).to be_nil
    end
  end

  describe "authentication" do
    let(:company) { create(:company, plan_tier: "paid") }

    it "returns unauthorized without auth credentials" do
      post mcp_path, params: initialize_payload.to_json, headers: {
        "CONTENT_TYPE" => "application/json",
        "ACCEPT" => "application/json, text/event-stream",
        "MCP-Protocol-Version" => "2025-03-26",
        "MCP-Method" => "initialize"
      }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "pro access allowlist" do
    context "with paid plan" do
      let(:company) { create(:company, plan_tier: "paid") }

      it "accepts initialize requests" do
        post mcp_path, params: initialize_payload.to_json, headers: mcp_headers(cli_token:, mcp_method: "initialize")

        expect(response).to have_http_status(:ok)
        expect(json_response["result"]).to be_present
      end
    end

    context "with active trial" do
      let(:company) do
        create(
          :company,
          plan_tier: "free",
          trial_started_at: 1.day.ago,
          trial_ends_at: 29.days.from_now
        )
      end

      it "accepts initialize requests" do
        post mcp_path, params: initialize_payload.to_json, headers: mcp_headers(cli_token:, mcp_method: "initialize")

        expect(response).to have_http_status(:ok)
      end
    end

    context "with billing exempt workspace" do
      let(:company) { create(:company, plan_tier: "free", billing_exempt: true) }

      it "accepts initialize requests" do
        post mcp_path, params: initialize_payload.to_json, headers: mcp_headers(cli_token:, mcp_method: "initialize")

        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe "origin validation" do
    let(:company) { create(:company, plan_tier: "paid") }

    around do |example|
      original = ENV["MCP_ALLOWED_ORIGINS"]
      ENV["MCP_ALLOWED_ORIGINS"] = "https://allowed.miru.test, https://also-allowed.miru.test"
      example.run
      ENV["MCP_ALLOWED_ORIGINS"] = original
    end

    it "allows requests from configured allowed origins" do
      headers = mcp_headers(cli_token:, mcp_method: "initialize").merge("Origin" => "https://allowed.miru.test")
      post mcp_path, params: initialize_payload.to_json, headers: headers

      expect(response).to have_http_status(:ok)
      expect(json_response["result"]).to be_present
    end

    it "allows requests when origin header is blank" do
      headers = mcp_headers(cli_token:, mcp_method: "initialize").merge("Origin" => "   ")
      post mcp_path, params: initialize_payload.to_json, headers: headers

      expect(response).to have_http_status(:ok)
      expect(json_response["result"]).to be_present
    end

    it "rejects requests from disallowed origins" do
      headers = mcp_headers(cli_token:, mcp_method: "initialize").merge("Origin" => "https://evil.example")
      post mcp_path, params: initialize_payload.to_json, headers: headers

      expect(response).to have_http_status(:forbidden)
      expect(json_response.dig("error", "code")).to eq(-32001)
      expect(json_response.dig("error", "data", "error")).to eq("invalid_origin")
      expect(json_response["id"]).to eq("1")
    end

    it "returns nil jsonrpc id when request body is blank" do
      headers = mcp_headers(cli_token:, mcp_method: "initialize")
        .merge("Origin" => "https://evil.example", "CONTENT_TYPE" => "text/plain")
      post mcp_path, params: "", headers: headers

      expect(response).to have_http_status(:forbidden)
      expect(json_response.dig("error", "data", "error")).to eq("invalid_origin")
      expect(json_response["id"]).to be_nil
    end
  end

  private

    def initialize_payload
      {
        jsonrpc: "2.0",
        id: "1",
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: {
            name: "miru-spec",
            version: "1.0.0"
          }
        }
      }
    end

    def mcp_headers(cli_token:, mcp_method:)
      cli_auth_headers(cli_token, {
        "CONTENT_TYPE" => "application/json",
        "ACCEPT" => "application/json, text/event-stream",
        "MCP-Protocol-Version" => "2025-03-26",
        "MCP-Method" => mcp_method
      })
    end
end
