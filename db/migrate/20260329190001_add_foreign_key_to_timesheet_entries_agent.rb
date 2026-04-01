# frozen_string_literal: true

class AddForeignKeyToTimesheetEntriesAgent < ActiveRecord::Migration[8.0]
  def change
    add_foreign_key :timesheet_entries, :agents, validate: false
  end
end
