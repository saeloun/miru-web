# frozen_string_literal: true

class ChangeLeaveTypeIdInTimeoffEntries < ActiveRecord::Migration[6.0]
  safety_assured do
    change_column :timeoff_entries, :leave_type_id, :bigint, null: true
  end
end
