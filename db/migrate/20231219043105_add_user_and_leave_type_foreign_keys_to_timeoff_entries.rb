# frozen_string_literal: true

class AddUserAndLeaveTypeForeignKeysToTimeoffEntries < ActiveRecord::Migration[7.0]
  def change
    add_foreign_key :timeoff_entries, :users, validate: false
    add_foreign_key :timeoff_entries, :leave_types, validate: false
  end
end
