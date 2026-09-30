# frozen_string_literal: true

module Invoices
  class Sent < ApplicationEvent
    def initialize(invoice, recipients_count:)
      @recipients_count = recipients_count
      super(invoice)
    end

    private

      def event_data
        { invoice_id: record.id, company_id: record.company_id, status: record.status, recipients_count: @recipients_count }
      end
  end
end
