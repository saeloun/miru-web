# frozen_string_literal: true

class CreateTimesheetEntries < ActiveRecord::Migration[7.0]
  def up
    create_table :timesheet_entries do |t|
      t.references :user, null: false, foreign_key: true
      t.references :project, null: false, foreign_key: true
      t.float :duration, null: false
      t.text :note, null: false
      t.boolean :billed
      t.date :work_date, null: false

      t.timestamps
    end
  end

  def down
    drop_table :timesheet_entries
  end
end
