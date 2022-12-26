# frozen_string_literal: true

class TimesheetEntriesPresenter
  attr_reader :timesheet_entries

  def initialize(timesheet_entries)
    @timesheet_entries = timesheet_entries
  end

  def group_snippets_by_work_date
    entries = {}
    timesheet_entries.each do |entry|
      entries[entry.work_date] ||= []
      entries[entry.work_date] << entry.snippet
    end
    entries
  end
end
