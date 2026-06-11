# frozen_string_literal: true

module QuickBooks
  class ExportPaymentJob < ApplicationJob
    queue_as :default

    retry_on Faraday::ConnectionFailed, Faraday::TimeoutError, wait: :polynomially_longer, attempts: 3

    def perform(quickbooks_connection_id, payment_id, trigger = "manual")
      connection = QuickbooksConnection.active.find(quickbooks_connection_id)
      payment = connection.company.payments
        .where(discarded_at: nil)
        .includes(invoice: [:client, :invoice_line_items, :invoice_taxes])
        .find(payment_id)

      QuickBooks::Exporters::Payment.new(
        connection:,
        source: source_for(trigger)
      ).export!(payment, trigger: trigger_for(trigger))
    end

    private

      def trigger_for(trigger)
        trigger_name = trigger.to_s
        trigger_name = "manual" unless QuickbooksSyncRun.triggers.key?(trigger_name)
        trigger_name.to_sym
      end

      def source_for(trigger)
        trigger_for(trigger) == :manual ? :manual : :local_change
      end
  end
end
