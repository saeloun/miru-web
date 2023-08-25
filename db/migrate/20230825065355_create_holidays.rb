# frozen_string_literal: true

class CreateHolidays < ActiveRecord::Migration[7.0]
  def change
    create_table :holidays do |t|
      t.integer :year, null: false
      t.boolean :enable_optional_holidays, default: false
      t.integer :no_of_allowed_optional_holidays
      t.string :holiday_types, array: true, default: []
      t.string :time_period_optional_holidays, default: "per_quarter"
      t.timestamps
    end
  end
end
