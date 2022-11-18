# frozen_string_literal: true

class AddDepartmentIdToSpaceUsages < ActiveRecord::Migration[7.0]
  def change
    add_column :space_usages, :department_id, :integer
  end
end
