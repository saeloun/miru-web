# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class TimeCreateTool < BaseTool
        tool_name "miru.time.create"
        description "Create a timesheet entry"
        input_schema(
          properties: {
            project_id: { type: "integer" },
            duration_minutes: { type: "number" },
            work_date: { type: "string", description: "Date in YYYY-MM-DD format" },
            note: { type: "string" },
            bill_status: { type: "string", enum: %w[unbilled non_billable billed] },
            source_metadata: { type: "object" },
            dry_run: { type: "boolean" },
            idempotency_key: { type: "string" }
          },
          required: ["project_id", "duration_minutes", "work_date"]
        )
        annotations read_only_hint: false, destructive_hint: false

        class << self
          def call(project_id:, duration_minutes:, work_date:, note: nil, bill_status: "unbilled", source_metadata: nil, dry_run: false, idempotency_key: nil, server_context:)
            body = {
              timesheet_entry: {
                project_id: project_id,
                duration_minutes: duration_minutes,
                work_date: work_date,
                note: note,
                bill_status: bill_status,
                source_metadata: merged_source_metadata(source_metadata)
              }
            }

            write_request(
              method: :post,
              path: "/api/v1/cli/timesheet_entries",
              body: body,
              dry_run: dry_run,
              idempotency_key: idempotency_key,
              server_context: server_context
            )
          rescue StandardError => e
            error_response("Failed to create timesheet entry", details: { error: e.message })
          end
        end
      end
    end
  end
end
