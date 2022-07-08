# frozen_string_literal: true

class CreateSpaceUsages < ActiveRecord::Migration[7.0]
  def change
    create_table :space_usages do |t|
      t.references :company, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :space_code
      t.integer :purpose_code
      t.float :start_duration
      t.float :end_duration
      t.date :work_date
      t.text :note
      t.boolean :restricted

      t.timestamps
    end
  end
end
