# frozen_string_literal: true

class AddDefaultValueToCalendarConnected < ActiveRecord::Migration[7.0]
  def up
    change_column_default :users, :calendar_enabled, default: false
  end

  def down
    change_column_default :users, :calendar_enabled, default: nil
  end
end
