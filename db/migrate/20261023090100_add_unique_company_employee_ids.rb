# frozen_string_literal: true

class AddUniqueCompanyEmployeeIds < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_index :employments, [:company_id, :employee_id], unique: true,
      where: "employee_id IS NOT NULL AND btrim(employee_id) <> ''",
      name: "index_employments_on_company_employee_id", algorithm: :concurrently
  end
end
