# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class InvoiceListTool < BaseTool
        tool_name "miru.invoice.list"
        description "List invoices visible to the authenticated user"
        input_schema(
          properties: {
            query: { type: "string" },
            page: { type: "integer" },
            per: { type: "integer" },
            status: { type: "string" }
          }
        )
        annotations read_only_hint: true, destructive_hint: false

        class << self
          def call(query: nil, page: nil, per: nil, status: nil, server_context:)
            result = proxy_request(
              method: :get,
              path: "/api/v1/invoices",
              params: {
                query: query,
                page: page,
                per: per,
                status: status
              },
              server_context: server_context
            )

            response_from_result(result)
          rescue StandardError => e
            error_response("Failed to list invoices", details: { error: e.message })
          end
        end
      end
    end
  end
end
