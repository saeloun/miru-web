# frozen_string_literal: true

class AddEmploymentDetailsToCompanyUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :company_users, :employee_id, :string
    add_column :company_users, :designation, :string
    add_column :company_users, :employment_type, :string
    add_column :company_users, :joined_at, :date
    add_column :company_users, :resigned_at, :date
  end
end
