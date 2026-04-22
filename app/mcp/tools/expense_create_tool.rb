# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class ExpenseCreateTool < BaseTool
        tool_name "miru.expense.create"
        description "Create one expense"
        input_schema(
          properties: {
            amount: { type: "number" },
            date: { type: "string", description: "Date in YYYY-MM-DD format" },
            category_name: { type: "string" },
            description: { type: "string" },
            expense_type: { type: "string", enum: %w[business personal] },
            vendor_name: { type: "string" },
            dry_run: { type: "boolean" },
            idempotency_key: { type: "string" }
          },
          required: ["amount", "date", "category_name"]
        )
        annotations read_only_hint: false, destructive_hint: false

        class << self
          def call(amount:, date:, category_name:, description: nil, expense_type: "business", vendor_name: nil, dry_run: false, idempotency_key: nil, server_context:)
            body = {
              expense: {
                amount: amount,
                date: date,
                description: description,
                expense_type: expense_type,
                category_name: category_name,
                vendor_name: vendor_name
              }
            }

            write_request(
              method: :post,
              path: "/api/v1/cli/expenses",
              body: body,
              dry_run: dry_run,
              idempotency_key: idempotency_key,
              server_context: server_context
            )
          rescue StandardError => e
            error_response("Failed to create expense", details: { error: e.message })
          end
        end
      end
    end
  end
end
