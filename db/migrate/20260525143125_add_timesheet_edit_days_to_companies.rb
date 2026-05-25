# frozen_string_literal: true

class AddTimesheetEditDaysToCompanies < ActiveRecord::Migration[8.1]
  def change
    add_column :companies, :timesheet_edit_days, :integer, default: 30, null: false
  end
end
