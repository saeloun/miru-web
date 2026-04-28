# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Agent readiness discovery", type: :request do
  it "serves a valid API catalog" do
    get "/.well-known/api-catalog"

    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("application/linkset+json")
    expect(JSON.parse(response.body).dig("linkset", 0, "https://www.iana.org/assignments/relation/service-desc")).to be_present
    expect(response.headers["Content-Signal"]).to eq("ai-train=yes, search=yes, ai-input=yes")
  end

  it "serves an MCP server card" do
    get "/.well-known/mcp/server-card.json"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("serverInfo", "name")).to eq("miru")
    expect(response.parsed_body.dig("transports", 0, "url")).to end_with("/mcp")
  end

  it "serves an Agent Skills index" do
    get "/.well-known/agent-skills/index.json"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["name"]).to eq("Miru")
    expect(response.parsed_body["skills"].first["resources"]).to include(a_string_ending_with("/openapi.json"))
  end

  it "serves an A2A agent card" do
    get "/.well-known/agent-card.json"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["name"]).to eq("Miru")
    expect(response.parsed_body["supportedInterfaces"]).to include(
      a_hash_including("protocol" => "mcp", "transport" => "streamable-http", "url" => a_string_ending_with("/mcp"))
    )
    expect(response.parsed_body["skills"]).to include(
      a_hash_including("id" => "miru-time-invoice-expense-automation")
    )
  end

  it "serves an OpenAPI description" do
    get "/openapi.json"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["openapi"]).to eq("3.1.0")
    expect(response.parsed_body.dig("paths", "/mcp", "post", "summary")).to eq("Miru MCP streamable HTTP endpoint")
  end

  it "serves AI-aware robots rules without long-lived static caching" do
    get "/robots.txt"

    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("text/plain")
    expect(response.body).to include("User-agent: GPTBot")
    expect(response.body).to include("Content-Signal: ai-train=yes, search=yes, ai-input=yes")
    expect(response.headers["Cache-Control"]).to eq("no-store")
    expect(response.headers["Content-Signal"]).to eq("ai-train=yes, search=yes, ai-input=yes")
  end
end
