# frozen_string_literal: true

class AddUniqueConstraintToClientMembers < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :client_members, [:client_id, :user_id], unique: true, algorithm: :concurrently
  end
end
