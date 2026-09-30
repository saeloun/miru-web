# frozen_string_literal: true

module Clients
  class Created < ApplicationEvent
    private

      def event_data
        { client_id: record.id, company_id: record.company_id }
      end
  end
end
