# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class TimeListTool < BaseTool
        tool_name "miru.time.list"
        description "List timesheet entries for a date range"
        input_schema(
          properties: {
            from: { type: "string", description: "Start date (YYYY-MM-DD)" },
            to: { type: "string", description: "End date (YYYY-MM-DD)" }
          },
          required: ["from", "to"]
        )
        annotations read_only_hint: true, destructive_hint: false

        class << self
          def call(from:, to:, server_context:)
            result = proxy_request(
              method: :get,
              path: "/api/v1/timesheet_entry",
              params: { from: from, to: to },
              server_context: server_context
            )

            response_from_result(result)
          rescue StandardError => e
            error_response("Failed to list timesheet entries", details: { error: e.message })
          end
        end
      end
    end
  end
end
