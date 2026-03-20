# frozen_string_literal: true

class AddCustomLeaveIdToTimeoffEntries < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_reference :timeoff_entries, :custom_leave, null: true, index: { algorithm: :concurrently }
  end
end
