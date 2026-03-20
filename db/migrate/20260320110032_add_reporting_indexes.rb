# frozen_string_literal: true

class AddReportingIndexes < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def change
    add_index :timesheet_entries, [:user_id, :work_date], algorithm: :concurrently
    add_index :invoices, [:company_id, :status], algorithm: :concurrently
    add_index :payments, :transaction_date, algorithm: :concurrently
    add_index :expenses, :date, algorithm: :concurrently
  end
end
