# frozen_string_literal: true

class AddTimesheetEditDaysToCompanies < ActiveRecord::Migration[8.1]
  def change
    # default: 30 intentionally replaces the previous hardcoded 7-day window.
    # All existing companies will receive the 30-day default on migration.
    # Admins can change this value in Organization Settings → Work Schedule.
    add_column :companies, :timesheet_edit_days, :integer, default: 30, null: false
  end
end
