# frozen_string_literal: true

require "rails_helper"

RSpec.describe MCP::Miru::ServerFactory do
  describe ".build" do
    it "registers full namespaced toolset for pro workspaces" do
      server = described_class.build(server_context: { pro_access: true, authorization: "Bearer token" })

      expect(server.tools.keys).to match_array(MCP::Miru::ToolCatalog.names)
    end

    it "registers no tools for non-pro workspaces" do
      server = described_class.build(server_context: { pro_access: false, authorization: "Bearer token" })

      expect(server.tools).to eq({})
    end

    it "derives pro_access from ProAccessChecker when not provided" do
      allow(MCP::Miru::ProAccessChecker).to receive(:pro_access?).with(authorization: "Bearer token").and_return(true)

      server = described_class.build(server_context: { authorization: "Bearer token" })

      expect(MCP::Miru::ProAccessChecker).to have_received(:pro_access?).with(authorization: "Bearer token")
      expect(server.tools.keys).to match_array(MCP::Miru::ToolCatalog.names)
      expect(server.server_context[:pro_access]).to eq(true)
    end

    it "handles non-hash server context safely" do
      allow(MCP::Miru::ProAccessChecker).to receive(:pro_access?).with(authorization: nil).and_return(false)

      server = described_class.build(server_context: nil)

      expect(server.tools).to eq({})
      expect(server.server_context[:pro_access]).to eq(false)
    end
  end
end
