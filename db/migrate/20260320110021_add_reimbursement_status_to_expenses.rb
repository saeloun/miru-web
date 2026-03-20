# frozen_string_literal: true

class AddReimbursementStatusToExpenses < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def change
    add_column :expenses, :status, :integer, default: 0, null: false
    add_column :expenses, :paid_at, :datetime
    add_index :expenses, :status, algorithm: :concurrently
  end
end
