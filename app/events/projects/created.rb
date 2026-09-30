# frozen_string_literal: true

module Projects
  class Created < ApplicationEvent
    private

      def event_data
        { project_id: record.id, client_id: record.client_id }
      end
  end
end
