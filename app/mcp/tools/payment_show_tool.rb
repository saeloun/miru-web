# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class PaymentShowTool < BaseTool
        tool_name "miru.payment.show"
        description "Show one payment"
        input_schema(
          properties: {
            id: { type: "integer" }
          },
          required: ["id"]
        )
        annotations read_only_hint: true, destructive_hint: false

        class << self
          def call(id:, server_context:)
            result = proxy_request(
              method: :get,
              path: "/api/v1/payments/#{id}",
              server_context: server_context
            )

            response_from_result(result)
          rescue StandardError => e
            error_response("Failed to show payment", details: { error: e.message })
          end
        end
      end
    end
  end
end
