# frozen_string_literal: true

class AddDiscardedAtToClientMembers < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_column :client_members, :discarded_at, :datetime
    add_index :client_members, :discarded_at, algorithm: :concurrently
  end
end
