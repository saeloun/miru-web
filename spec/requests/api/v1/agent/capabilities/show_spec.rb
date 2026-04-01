# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Agent::Capabilities#show", type: :request do
  let(:company) { create(:company, plan_tier: "free") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:agent) { create(:agent, company:, user:, name: "Claude Delivery", provider: "claude") }
  let(:issued_key) { AgentKey.issue_for(agent:, name: "Primary Key", created_by: user) }
  let(:agent_token) { issued_key.last }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
  end

  it "returns the available commands for agent-authenticated clients" do
    send_request :get, api_v1_agent_capabilities_path, headers: {
      "Authorization" => "Bearer #{agent_token}"
    }

    expect(response).to have_http_status(:ok)
    expect(json_response.dig("agent", "name")).to eq("Claude Delivery")
    expect(json_response["commands"]).to contain_exactly(
      a_hash_including(
        "name" => "time create",
        "requires_review" => true,
        "supports_source_metadata" => true,
        "supports_proof_metadata" => true
      )
    )
  end

  it "returns unauthorized for missing or malformed tokens" do
    send_request :get, api_v1_agent_capabilities_path
    expect(response).to have_http_status(:unauthorized)

    send_request :get, api_v1_agent_capabilities_path, headers: {
      "Authorization" => "Bearer definitely-wrong"
    }
    expect(response).to have_http_status(:unauthorized)
  end
end
