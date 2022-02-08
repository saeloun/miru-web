# frozen_string_literal: true

module Timesheet
  extend ActiveSupport::Concern

  def formatted_entries_by_date(timesheet_entries)
    entries = {}
    timesheet_entries.map do |entry|
      entries[entry.work_date] ||= []
      entries[entry.work_date] << entry.formatted_entry
    end
    entries
  end
end
