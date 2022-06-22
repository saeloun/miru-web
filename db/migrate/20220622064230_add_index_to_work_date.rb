# frozen_string_literal: true

class AddIndexToWorkDate < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :timesheet_entries, :work_date, algorithm: :concurrently
  end
end
