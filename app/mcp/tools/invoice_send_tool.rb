# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class InvoiceSendTool < BaseTool
        tool_name "miru.invoice.send"
        description "Send one invoice email"
        input_schema(
          properties: {
            id: { type: "integer" },
            recipients: {
              type: "array",
              items: { type: "string" }
            },
            subject: { type: "string" },
            message: { type: "string" },
            dry_run: { type: "boolean" },
            idempotency_key: { type: "string" }
          },
          required: ["id", "recipients"]
        )
        annotations read_only_hint: false, destructive_hint: false

        class << self
          def call(id:, recipients:, subject: nil, message: nil, dry_run: false, idempotency_key: nil, server_context:)
            body = {
              invoice_email: {
                recipients: Array(recipients).compact_blank,
                subject: subject,
                message: message
              }
            }

            write_request(
              method: :post,
              path: "/api/v1/invoices/#{id}/send_invoice",
              body: body,
              dry_run: dry_run,
              idempotency_key: idempotency_key,
              server_context: server_context
            )
          rescue StandardError => e
            error_response("Failed to send invoice", details: { error: e.message })
          end
        end
      end
    end
  end
end
