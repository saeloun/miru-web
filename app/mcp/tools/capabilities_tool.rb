# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class CapabilitiesTool < BaseTool
        tool_name "miru.capabilities"
        description "List Miru MCP tools and their read/write behavior"
        annotations read_only_hint: true, destructive_hint: false

        class << self
          def call(server_context:)
            MCP::Tool::Response.new(
              [{
                type: "text",
                text: JSON.pretty_generate({
                  pro_access: context(server_context)[:pro_access] == true,
                  tools: MCP::Miru::ToolCatalog::TOOLS
                })
              }]
            )
          end
        end
      end
    end
  end
end
