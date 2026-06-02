# frozen_string_literal: true

module QuickBooks
  module Mappers
    class Invoice < Base
      def initialize(connection:)
        @connection = connection
      end

      def payload(invoice, customer_reference:)
        validate!(invoice)

        compact_payload(
          "CustomerRef" => { "value" => customer_reference.quickbooks_entity_id },
          "DocNumber" => truncate(invoice.invoice_number, 21),
          "TxnDate" => qbo_date(invoice.issue_date),
          "DueDate" => qbo_date(invoice.due_date),
          "CurrencyRef" => currency(invoice),
          "BillEmail" => bill_email(invoice),
          "PrivateNote" => private_note(invoice),
          "Line" => lines(invoice)
        )
      end

      def update_payload(invoice, customer_reference:, reference:)
        payload(invoice, customer_reference:).merge(
          "Id" => reference.quickbooks_entity_id,
          "SyncToken" => reference.quickbooks_sync_token,
          "sparse" => false
        )
      end

      private

        attr_reader :connection

        def validate!(invoice)
          if connection.service_item_id.blank?
            raise QuickBooks::MappingError, "QuickBooks service item mapping is required before exporting invoices"
          end

          return unless BigDecimal(invoice.tax.to_s).positive? && connection.tax_code_id.blank?

          raise QuickBooks::MappingError, "QuickBooks tax code mapping is required before exporting invoices with tax"
        end

        def currency(invoice)
          return if invoice.currency.blank?

          { "value" => invoice.currency }
        end

        def bill_email(invoice)
          return if invoice.client_email.blank?

          { "Address" => truncate(invoice.client_email, 100) }
        end

        def private_note(invoice)
          note = ["Miru invoice #{invoice.id}"]
          note << "Reference: #{invoice.reference}" if invoice.reference.present?
          truncate(note.join(" | "), 4000)
        end

        def lines(invoice)
          taxable = BigDecimal(invoice.tax.to_s).positive?
          sales_lines = invoice.invoice_line_items.map { |line_item| sales_line(line_item, taxable:) }
          sales_lines = [fallback_sales_line(invoice, taxable:)] if sales_lines.empty?

          if BigDecimal(invoice.discount.to_s).positive?
            sales_lines << discount_line(invoice)
          end

          sales_lines
        end

        def sales_line(line_item, taxable:)
          amount = money(line_item.hours_spent * line_item.rate)
          detail = {
            "ItemRef" => { "value" => connection.service_item_id },
            "Qty" => quantity(line_item.hours_spent),
            "UnitPrice" => money(line_item.rate),
            "ServiceDate" => qbo_date(line_item.date)
          }
          detail["TaxCodeRef"] = { "value" => connection.tax_code_id } if taxable && connection.tax_code_id.present?

          compact_payload(
            "DetailType" => "SalesItemLineDetail",
            "Amount" => amount,
            "Description" => line_item_description(line_item),
            "SalesItemLineDetail" => detail
          )
        end

        def fallback_sales_line(invoice, taxable:)
          detail = {
            "ItemRef" => { "value" => connection.service_item_id },
            "Qty" => 1,
            "UnitPrice" => money(invoice.amount)
          }
          detail["TaxCodeRef"] = { "value" => connection.tax_code_id } if taxable && connection.tax_code_id.present?

          compact_payload(
            "DetailType" => "SalesItemLineDetail",
            "Amount" => money(invoice.amount),
            "Description" => "Invoice #{invoice.invoice_number}",
            "SalesItemLineDetail" => detail
          )
        end

        def discount_line(invoice)
          compact_payload(
            "DetailType" => "DiscountLineDetail",
            "Amount" => money(invoice.discount),
            "DiscountLineDetail" => {
              "PercentBased" => false
            }
          )
        end

        def line_item_description(line_item)
          [line_item.name, line_item.description].filter_map { |value| value.presence }.join(" - ")
        end
    end
  end
end
