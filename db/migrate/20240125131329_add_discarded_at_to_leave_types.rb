# frozen_string_literal: true

class AddDiscardedAtToLeaveTypes < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_column :leave_types, :discarded_at, :datetime
    add_index :leave_types, :discarded_at, algorithm: :concurrently
  end
end
