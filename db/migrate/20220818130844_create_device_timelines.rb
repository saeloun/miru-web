# frozen_string_literal: true

class CreateDeviceTimelines < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    if table_exists?(:employment_details)
      # db/migrate/20220622160123_drop_employment_details_table.rb
      drop_table :employment_details
    end
    if table_exists?(:previous_employment_details)
      # db/migrate/20220620122048_change_previous_employment_detail_to_previous_employment.rb
      rename_table :previous_employment_details, :previous_employments
    end
    if column_exists?(:previous_employments, :employment_detail_id)
      remove_reference :previous_employments, :employment_detail, null: false, foreign_key: true
    end

    unless index_exists?(:timesheet_entries, :work_date, algorithm: :concurrently)
      add_index :timesheet_entries, :work_date, algorithm: :concurrently
    end

    add_reference :devices, :assignee, foreign_key: { to_table: :users }
    add_column :devices, :available, :boolean
    add_column :devices, :version, :string
    add_column :devices, :version_id, :string
    add_column :devices, :brand, :string
    add_column :devices, :manufacturer, :string
    add_column :devices, :base_os, :string
    add_column :devices, :meta_details, :text

    create_table :device_usages do |t|
      t.boolean :approve
      t.references :created_by, foreign_key: { to_table: :users }
      t.references :device, null: false, foreign_key: true
      t.references :assignee, foreign_key: { to_table: :users }

      t.timestamps
    end

    create_table :device_timelines do |t|
      t.text :index_system_display_message
      t.text :index_system_display_title
      t.references :device, null: false, foreign_key: true
      t.string :action_subject

      t.timestamps
    end
  end
end
