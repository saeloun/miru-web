# frozen_string_literal: true

class AddDiscardedAtToTimeoffEntries < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_column :timeoff_entries, :discarded_at, :datetime
    add_index :timeoff_entries, :discarded_at, algorithm: :concurrently
  end
end
