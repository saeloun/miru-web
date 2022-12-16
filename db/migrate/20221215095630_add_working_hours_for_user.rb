# frozen_string_literal: true

class AddWorkingHoursForUser < ActiveRecord::Migration[7.0]
  def change
    add_column :employments, :fixed_working_hours, :integer, default: 40, null: false
  end
end
