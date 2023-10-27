# frozen_string_literal: true

class CreateBulkTimeEntriesService
  attr_accessor :entries_data, :user_id

  def initialize(entries_data:, user_id:)
    @entries_data = entries_data
    @user_id = user_id
  end

  def process
    ActiveRecord::Base.transaction do
      entries_data.each do |entry_data|
        timesheet_entry = TimesheetEntry.new(entry_data)
        timesheet_entry.user_id = user_id
        timesheet_entry.project_id = entry_data[:project_id]

        unless timesheet_entry.valid?
          render json: { error: "An error occurred while trying to add meetings. Please try again." },
            status: :unprocessable_entity
          return
        end

        timesheet_entry.save!
      end
    end
  end
end
