# frozen_string_literal: true

module TimesheetEntryPresenters
  class GroupByDatePresenter
    attr_reader :timesheet_entries

    def initialize(timesheet_entries)
      @timesheet_entries = timesheet_entries
    end

    def format_entries
      entries = {}
      timesheet_entries.map do |entry|
        entries[entry.work_date] ||= []
        entries[entry.work_date] << entry.formatted_entry
      end
      entries
    end
  end
end
