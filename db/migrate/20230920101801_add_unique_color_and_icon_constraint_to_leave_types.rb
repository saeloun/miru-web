# frozen_string_literal: true

class AddUniqueColorAndIconConstraintToLeaveTypes < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :leave_types, [:color, :leave_id], unique: true, algorithm: :concurrently
    add_index :leave_types, [:icon, :leave_id], unique: true, algorithm: :concurrently
  end
end
