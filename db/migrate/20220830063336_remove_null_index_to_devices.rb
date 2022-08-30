# frozen_string_literal: true

class RemoveNullIndexToDevices < ActiveRecord::Migration[7.0]
  def up
    change_column_null :devices, :user_id, true
  end

  def down
    change_column_null :devices, :user_id, false
  end
end
