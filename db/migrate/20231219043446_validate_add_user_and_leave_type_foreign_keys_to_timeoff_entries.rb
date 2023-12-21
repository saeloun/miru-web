# frozen_string_literal: true

class ValidateAddUserAndLeaveTypeForeignKeysToTimeoffEntries < ActiveRecord::Migration[7.0]
  def change
    validate_foreign_key :timeoff_entries, :users
    validate_foreign_key :timeoff_entries, :leave_types
  end
end
