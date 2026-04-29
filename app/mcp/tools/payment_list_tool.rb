# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class PaymentListTool < BaseTool
        tool_name "miru.payment.list"
        description "List payments visible to the authenticated user"
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
              path: "/api/v1/payments",
              params: { query: query },
              server_context: server_context
            )

            response_from_result(result)
          rescue StandardError => e
            # Avoid leaking upstream/internal exception text in tool responses.
            Rails.logger.error("[MCP][miru.payment.list] #{e.class}: #{e.message} backtrace=#{Array(e.backtrace).first(5).join(' | ')}")
            error_response("Failed to list payments", details: { code: "PAYMENT_LIST_FAILED" })
          end
        end
      end
    end
  end
end
