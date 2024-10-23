# frozen_string_literal: true

class AddWorkingDaysAndHoursToCompany < ActiveRecord::Migration[7.1]
  def change
    add_column :companies, :working_days, :string
    add_column :companies, :working_hours, :string
  end
end
