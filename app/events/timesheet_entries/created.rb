# frozen_string_literal: true

module TimesheetEntries
  class Created < ApplicationEvent
    private

      def event_data
        { timesheet_entry_id: record.id, project_id: record.project_id, user_id: record.user_id, duration: record.duration }
      end
  end
end
