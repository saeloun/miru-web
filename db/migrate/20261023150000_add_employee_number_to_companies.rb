# frozen_string_literal: true

class AddEmployeeNumberToCompanies < ActiveRecord::Migration[8.1]
  def change
    add_column :companies, :last_employee_number, :bigint, default: 0, null: false
  end
end
