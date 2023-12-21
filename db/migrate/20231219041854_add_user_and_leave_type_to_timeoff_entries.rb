# frozen_string_literal: true

class AddUserAndLeaveTypeToTimeoffEntries < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_reference :timeoff_entries, :user, null: false, index: { algorithm: :concurrently }
    add_reference :timeoff_entries, :leave_type, null: false, index: { algorithm: :concurrently }
  end
end
