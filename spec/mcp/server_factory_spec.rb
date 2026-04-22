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
  end
end
