# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class ExpenseListTool < BaseTool
        tool_name "miru.expense.list"
        description "List expenses visible to the authenticated user"
        input_schema(
          properties: {
            query: { type: "string" }
          }
        )
        annotations read_only_hint: true, destructive_hint: false

        class << self
          def call(query: nil, server_context:)
            result = proxy_request(
              method: :get,
              path: "/api/v1/cli/expenses",
              params: { query: query },
              server_context: server_context
            )

            response_from_result(result)
          rescue StandardError => e
            error_response("Failed to list expenses", details: { error: e.message })
          end
        end
      end
    end
  end
end
