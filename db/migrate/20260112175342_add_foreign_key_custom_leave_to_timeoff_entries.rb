# frozen_string_literal: true

class AddForeignKeyCustomLeaveToTimeoffEntries < ActiveRecord::Migration[7.0]
  def change
    add_foreign_key :timeoff_entries, :custom_leaves, column: :custom_leave_id, validate: false
  end
end
