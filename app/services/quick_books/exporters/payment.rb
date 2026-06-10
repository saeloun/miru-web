# frozen_string_literal: true

module QuickBooks
  module Exporters
    class Payment < Base
      def export!(payment, trigger: :manual)
        with_sync_run(trigger:) do |run|
          invoice_reference = QuickBooks::Exporters::Invoice.new(
            connection: connection,
            qbo_client: qbo_client,
            sync_run: run,
            source: source
          ).export!(payment.invoice, trigger:)
          customer_reference = quickbooks_reference_for(payment.invoice.client, "Customer")

          unless customer_reference.synced?
            raise QuickBooks::MappingError, "QuickBooks customer export must complete before exporting a payment"
          end

          mapper = QuickBooks::Mappers::Payment.new(connection: connection)
          desired_payload = mapper.payload(payment, customer_reference:, invoice_reference:)

          export_remote_record!(
            run:,
            record: payment,
            entity_type: "Payment",
            desired_payload:,
            update_payload: ->(reference) {
              mapper.update_payload(payment, customer_reference:, invoice_reference:, reference:)
            }
          )
        end
      end
    end
  end
end
