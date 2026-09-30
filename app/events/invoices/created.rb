# frozen_string_literal: true

module Invoices
  class Created < ApplicationEvent
    private

      def event_data
        { invoice_id: record.id, company_id: record.company_id, client_id: record.client_id, status: record.status }
      end
  end
end
