# frozen_string_literal: true

class AddLeaveForeignKeyToLeaveTypes < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_foreign_key :leave_types, :leaves, column: :leave_id, validate: false
  end
end
