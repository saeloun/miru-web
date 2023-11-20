# frozen_string_literal: true

class AddDefaultValueToCalendarConnectedToUsers < ActiveRecord::Migration[7.0]
  def up
    change_column_default :users, :calendar_connected, default: false
  end

  def down
    change_column_default :users, :calendar_connected, default: nil
  end
end
