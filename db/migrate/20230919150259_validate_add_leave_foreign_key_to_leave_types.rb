# frozen_string_literal: true

class ValidateAddLeaveForeignKeyToLeaveTypes < ActiveRecord::Migration[7.0]
  def change
    validate_foreign_key :leave_types, :leaves
  end
end
