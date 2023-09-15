# frozen_string_literal: true

class AddDefaultValueToCalendarEnabledToCompany < ActiveRecord::Migration[7.0]
  def up
    change_column_default :companies, :calendar_enabled, default: false
  end

  def down
    change_column_default :companies, :calendar_enabled, default: nil
  end
end
