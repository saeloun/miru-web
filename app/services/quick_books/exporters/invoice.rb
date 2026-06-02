# frozen_string_literal: true

module QuickBooks
  module Exporters
    class Invoice < Base
      def export!(invoice, trigger: :manual)
        with_sync_run(trigger:) do |run|
          customer_reference = QuickBooks::Exporters::Customer.new(
            connection: connection,
            qbo_client: qbo_client,
            sync_run: run,
            source: source
          ).export!(invoice.client, trigger:)

          mapper = QuickBooks::Mappers::Invoice.new(connection: connection)
          desired_payload = mapper.payload(invoice, customer_reference:)

          export_remote_record!(
            run:,
            record: invoice,
            entity_type: "Invoice",
            desired_payload:,
            update_payload: ->(reference) { mapper.update_payload(invoice, customer_reference:, reference:) }
          )
        end
      end
    end
  end
end
