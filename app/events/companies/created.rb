# frozen_string_literal: true

module Companies
  class Created < ApplicationEvent
    private

      def event_data
        { company_id: record.id }
      end
  end
end
