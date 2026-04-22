# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class ClientListTool < BaseTool
        tool_name "miru.client.list"
        description "List clients visible to the authenticated user"
        input_schema(
          properties: {
            query: { type: "string", description: "Optional client search term" }
          }
        )
        annotations read_only_hint: true, destructive_hint: false

        class << self
          def call(query: nil, server_context:)
            result = proxy_request(
              method: :get,
              path: "/api/v1/cli/clients",
              params: { query: query },
              server_context: server_context
            )

            response_from_result(result)
          rescue StandardError => e
            error_response("Failed to list clients", details: { error: e.message })
          end
        end
      end
    end
  end
end
