# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class TimeDeleteTool < BaseTool
        tool_name "miru.time.delete"
        description "Delete a timesheet entry"
        input_schema(
          properties: {
            id: { type: "integer" },
            dry_run: { type: "boolean" },
            idempotency_key: { type: "string" }
          },
          required: ["id"]
        )
        annotations read_only_hint: false, destructive_hint: true

        class << self
          def call(id:, dry_run: false, idempotency_key: nil, server_context:)
            write_request(
              method: :delete,
              path: "/api/v1/cli/timesheet_entries/#{id}",
              body: nil,
              dry_run: dry_run,
              idempotency_key: idempotency_key,
              server_context: server_context
            )
          rescue StandardError => e
            error_response("Failed to delete timesheet entry", details: { error: e.message })
          end
        end
      end
    end
  end
end
