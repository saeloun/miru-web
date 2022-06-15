# frozen_string_literal: true

class AddDepartmentIdToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :department_id, :integer
  end
end
