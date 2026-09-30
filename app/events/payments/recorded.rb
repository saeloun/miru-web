# frozen_string_literal: true

module Payments
  class Recorded < ApplicationEvent
    private

      def event_data
        { payment_id: record.id, invoice_id: record.invoice_id, status: record.status, transaction_type: record.transaction_type }
      end
  end
end
