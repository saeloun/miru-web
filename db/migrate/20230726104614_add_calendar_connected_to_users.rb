# frozen_string_literal: true

class AddCalendarConnectedToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :calendar_connected, :boolean
  end
end
