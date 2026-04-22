# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class WorkspaceWhoamiTool < BaseTool
        tool_name "miru.workspace.whoami"
        description "Get authenticated user and workspace details"
        annotations read_only_hint: true, destructive_hint: false

        class << self
          def call(server_context:)
            result = proxy_request(
              method: :get,
              path: "/api/v1/users/_me",
              server_context: server_context
            )

            response_from_result(result)
          rescue StandardError => e
            error_response("Failed to fetch workspace identity", details: { error: e.message })
          end
        end
      end
    end
  end
end
