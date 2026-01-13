# frozen_string_literal: true

class ValidateForeignKeyCustomLeaveToTimeoffEntries < ActiveRecord::Migration[7.0]
  def change
    validate_foreign_key :timeoff_entries, :custom_leaves, column: :custom_leave_id
  end
end
