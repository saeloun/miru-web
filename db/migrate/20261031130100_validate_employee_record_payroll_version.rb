# frozen_string_literal: true

class ValidateEmployeeRecordPayrollVersion < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    validate_check_constraint :employee_records, name: "employee_records_payroll_version_nonnegative"
  end
end
