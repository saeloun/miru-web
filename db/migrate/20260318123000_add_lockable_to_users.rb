# frozen_string_literal: true

class AddLockableToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :failed_attempts, :integer, default: 0, null: false
    add_column :users, :locked_at, :datetime

    add_index :users, :locked_at, algorithm: :concurrently
  end

  disable_ddl_transaction!
end
