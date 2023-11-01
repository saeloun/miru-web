# frozen_string_literal: true

class CreateBulkTimeEntriesService
  attr_accessor :entries_data, :user_id

  def initialize(entries_data:, user_id:)
    @entries_data = entries_data
    @user_id = user_id
  end

  def process
    ActiveRecord::Base.transaction do
      create_timesheet_entries_from_data
    end
  end

  private

    def create_timesheet_entries_from_data
      return if entries_data.blank?

      entries_data.each do |entry_data|
        timesheet_entry = TimesheetEntry.new(entry_data)
        timesheet_entry.user_id = user_id
        timesheet_entry.project_id = entry_data[:project_id]

        timesheet_entry.save!
      end
    end
end
