# frozen_string_literal: true

class AddPayrollVersionToEmployeeRecords < ActiveRecord::Migration[8.1]
  def change
    add_column :employee_records, :payroll_version, :bigint, default: 0, null: false
    add_column :employee_records, :lock_version, :bigint, default: 0, null: false
    add_check_constraint :employee_records, "payroll_version >= 0", name: "employee_records_payroll_version_nonnegative", validate: false
  end
end
