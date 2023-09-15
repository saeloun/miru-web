# frozen_string_literal: true

class AddCalendarEnabledToCompany < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :calendar_enabled, :boolean
  end
end
