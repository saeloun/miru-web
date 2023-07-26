# frozen_string_literal: true

class AddDefaultValueToCalendarConnected < ActiveRecord::Migration[7.0]
  def change
    change_column_default :users, :calendar_connected, default: false
  end
end
