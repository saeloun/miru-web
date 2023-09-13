# frozen_string_literal: true

class CreateHolidayInfos < ActiveRecord::Migration[7.0]
  def change
    create_table :holiday_infos do |t|
      t.date :date, null: false
      t.string :name, null: false
      t.references :holiday, foreign_key: true, null: false
      t.integer :category, default: 0, null: false
      t.timestamps
    end
  end
end
