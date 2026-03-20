# frozen_string_literal: true

class AddDiscardedAtToExpenses < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def change
    add_column :expenses, :discarded_at, :datetime
    add_index :expenses, :discarded_at, algorithm: :concurrently
  end
end
