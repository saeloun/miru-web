# frozen_string_literal: true

module Invoices
  class StatusChanged < ApplicationEvent
    def initialize(invoice, from:, to:)
      @from = from
      @to = to
      super(invoice)
    end

    private

      def event_data
        { invoice_id: record.id, company_id: record.company_id, from: @from, to: @to }
      end
  end
end
