# frozen_string_literal: true

class AddDefaultValuesToWorkingDaysAndHours < ActiveRecord::Migration[7.1]
  def change
    change_column_default :companies, :working_days, "5"
    change_column_default :companies, :working_hours, "40"
  end
end
