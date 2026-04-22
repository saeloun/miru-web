# frozen_string_literal: true

require "rails_helper"

RSpec.describe MCP::Miru::Client do
  describe ".http" do
    it "builds an MCP client with HTTP transport" do
      transport = instance_double(MCP::Client::HTTP)
      mcp_client = instance_double(MCP::Client, tools: [])

      allow(MCP::Client::HTTP).to receive(:new).and_return(transport)
      allow(MCP::Client).to receive(:new).with(transport: transport).and_return(mcp_client)

      client = described_class.http(url: "https://app.miru.so/mcp", headers: { "Authorization" => "Bearer t" })

      expect(client).to be_a(described_class)
      expect(MCP::Client::HTTP).to have_received(:new).with(
        url: "https://app.miru.so/mcp",
        headers: { "Authorization" => "Bearer t" }
      )
    end
  end

  describe ".stdio" do
    it "builds an MCP client with stdio transport" do
      transport = instance_double(MCP::Client::Stdio)
      mcp_client = instance_double(MCP::Client, tools: [])

      allow(MCP::Client::Stdio).to receive(:new).and_return(transport)
      allow(MCP::Client).to receive(:new).with(transport: transport).and_return(mcp_client)

      client = described_class.stdio(
        command: "/tmp/miru-mcp",
        args: ["--verbose"],
        env: { "MIRU_MCP_TOKEN" => "token" },
        read_timeout: 10
      )

      expect(client).to be_a(described_class)
      expect(MCP::Client::Stdio).to have_received(:new).with(
        command: "/tmp/miru-mcp",
        args: ["--verbose"],
        env: { "MIRU_MCP_TOKEN" => "token" },
        read_timeout: 10
      )
    end
  end

  describe "#call_tool" do
    let(:transport) { double("transport") }
    let(:tool) { instance_double(MCP::Client::Tool, name: "miru.project.list") }
    let(:mcp_client) { instance_double(MCP::Client, tools: [tool]) }

    subject(:client) { described_class.new(transport:) }

    before do
      allow(MCP::Client).to receive(:new).with(transport:).and_return(mcp_client)
    end

    it "calls the matching tool by name" do
      result = instance_double(MCP::Tool::Response)
      allow(mcp_client).to receive(:call_tool).and_return(result)

      response = client.call_tool(name: :"miru.project.list", arguments: { query: "acme" })

      expect(response).to eq(result)
      expect(mcp_client).to have_received(:call_tool).with(tool:, arguments: { query: "acme" })
    end

    it "raises when tool name is unknown" do
      expect do
        client.call_tool(name: "miru.unknown", arguments: {})
      end.to raise_error(ArgumentError, "Unknown MCP tool: miru.unknown")
    end
  end

  describe "#close" do
    it "closes the transport when supported" do
      transport = double("transport")
      mcp_client = instance_double(MCP::Client, tools: [])
      allow(MCP::Client).to receive(:new).with(transport:).and_return(mcp_client)
      allow(transport).to receive(:respond_to?).with(:close).and_return(true)
      allow(transport).to receive(:close)

      described_class.new(transport:).close

      expect(transport).to have_received(:close)
    end
  end
end
