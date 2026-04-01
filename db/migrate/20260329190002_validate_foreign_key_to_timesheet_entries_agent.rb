# frozen_string_literal: true

class ValidateForeignKeyToTimesheetEntriesAgent < ActiveRecord::Migration[8.0]
  def change
    validate_foreign_key :timesheet_entries, :agents
  end
end
