# frozen_string_literal: true

class CreateEmployeeReportsAndReminders < ActiveRecord::Migration[8.1]
  def change
    create_table :employee_reports do |table|
      table.references :company, null: false, foreign_key: true
      table.string :name, null: false
      table.jsonb :columns, null: false, default: []
      table.timestamps
    end
    create_table :employee_record_settings do |table|
      table.references :company, null: false, foreign_key: true, index: { unique: true }
      table.boolean :occasion_reminders_enabled, null: false, default: false
      table.timestamps
    end
    create_table :employee_occasion_deliveries do |table|
      table.references :employment, null: false, foreign_key: true
      table.references :admin, null: false, foreign_key: { to_table: :users }
      table.string :kind, null: false
      table.date :event_on, null: false
      table.datetime :delivered_at, null: false
    end
    add_index :employee_occasion_deliveries, [:employment_id, :admin_id, :kind, :event_on],
      unique: true, name: "index_employee_occasion_deliveries_unique_event"
  end
end
