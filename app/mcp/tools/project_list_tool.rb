# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class ProjectListTool < BaseTool
        tool_name "miru.project.list"
        description "List projects visible to the authenticated user"
        input_schema(
          properties: {
            search: { type: "string", description: "Optional project search term" }
          }
        )
        annotations read_only_hint: true, destructive_hint: false

        class << self
          def call(search: nil, server_context:)
            result = proxy_request(
              method: :get,
              path: "/api/v1/projects",
              params: { search_term: search },
              server_context: server_context
            )

            response_from_result(result)
          rescue StandardError => e
            error_response("Failed to list projects", details: { error: e.message })
          end
        end
      end
    end
  end
end
