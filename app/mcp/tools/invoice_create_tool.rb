# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class InvoiceCreateTool < BaseTool
        tool_name "miru.invoice.create"
        description "Create one draft invoice"
        input_schema(
          properties: {
            client_id: { type: "integer" },
            invoice_number: { type: "string" },
            issue_date: { type: "string", description: "Date in YYYY-MM-DD format" },
            due_date: { type: "string", description: "Date in YYYY-MM-DD format" },
            status: { type: "string" },
            currency: { type: "string" },
            reference: { type: "string" },
            discount: { type: "number" },
            tax: { type: "number" },
            stripe_enabled: { type: "boolean" },
            line_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  date: { type: "string" },
                  rate: { type: "number" },
                  quantity: { type: "number", description: "Minutes" },
                  timesheet_entry_id: { type: "integer" },
                  linked_timesheet_entry_ids: {
                    type: "array",
                    items: { type: "integer" }
                  }
                },
                required: ["name", "date", "rate", "quantity"]
              }
            },
            invoice_taxes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tax_configuration_id: { type: "integer" },
                  name: { type: "string" },
                  calculation_method: { type: "string" },
                  value: { type: "number" },
                  amount: { type: "number" }
                }
              }
            },
            dry_run: { type: "boolean" },
            idempotency_key: { type: "string" }
          },
          required: ["client_id", "invoice_number", "issue_date", "due_date", "line_items"]
        )
        annotations read_only_hint: false, destructive_hint: false

        class << self
          def call(client_id:, invoice_number:, issue_date:, due_date:, line_items:, status: "draft", currency: nil, reference: nil, discount: 0, tax: nil, stripe_enabled: nil, invoice_taxes: nil, dry_run: false, idempotency_key: nil, server_context:)
            invoice = {
              client_id: client_id,
              invoice_number: invoice_number,
              issue_date: issue_date,
              due_date: due_date,
              status: status,
              currency: currency,
              reference: reference,
              discount: discount,
              invoice_line_items_attributes: normalized_line_items(line_items)
            }.compact

            invoice[:tax] = tax unless tax.nil?
            invoice[:stripe_enabled] = stripe_enabled unless stripe_enabled.nil?

            normalized_taxes = normalized_invoice_taxes(invoice_taxes)
            invoice[:invoice_taxes_attributes] = normalized_taxes if normalized_taxes.present?

            write_request(
              method: :post,
              path: "/api/v1/invoices",
              body: { invoice: invoice },
              dry_run: dry_run,
              idempotency_key: idempotency_key,
              server_context: server_context
            )
          rescue StandardError => e
            error_response("Failed to create invoice", details: { error: e.message })
          end

          private

            def normalized_line_items(line_items)
              Array(line_items).map do |line_item|
                line_item.to_h.deep_symbolize_keys.slice(
                  :name,
                  :description,
                  :date,
                  :rate,
                  :quantity,
                  :timesheet_entry_id,
                  :linked_timesheet_entry_ids
                ).compact
              end
            end

            def normalized_invoice_taxes(invoice_taxes)
              Array(invoice_taxes).filter_map do |invoice_tax|
                invoice_tax.to_h.deep_symbolize_keys.slice(
                  :tax_configuration_id,
                  :name,
                  :calculation_method,
                  :value,
                  :amount
                ).compact.presence
              end
            end
        end
      end
    end
  end
end
