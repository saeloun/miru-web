# frozen_string_literal: true

class AddLeaveIdToLeaveTypes < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_reference :leave_types, :leave, null: false, index: { algorithm: :concurrently }
  end
end
