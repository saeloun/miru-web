# frozen_string_literal: true

class AddSourceMetadataToTimesheetEntries < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_column :timesheet_entries, :source, :string, null: false, default: "manual"
    add_column :timesheet_entries, :source_metadata, :jsonb, null: false, default: {}

    add_index :timesheet_entries, :source, algorithm: :concurrently
  end
end
