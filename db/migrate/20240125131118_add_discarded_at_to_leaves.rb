# frozen_string_literal: true

class AddDiscardedAtToLeaves < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_column :leaves, :discarded_at, :datetime
    add_index :leaves, :discarded_at, algorithm: :concurrently
  end
end
