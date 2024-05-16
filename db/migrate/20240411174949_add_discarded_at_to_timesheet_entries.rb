# frozen_string_literal: true

class AddDiscardedAtToTimesheetEntries < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_column :timesheet_entries, :discarded_at, :datetime
    add_index :timesheet_entries, :discarded_at, algorithm: :concurrently
  end
end
