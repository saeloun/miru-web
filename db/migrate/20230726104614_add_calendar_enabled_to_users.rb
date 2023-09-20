# frozen_string_literal: true

class AddCalendarEnabledToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :calendar_enabled, :boolean
  end
end
