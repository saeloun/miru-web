# frozen_string_literal: true

class ChangeCompanyUsersTableNameToEmployments < ActiveRecord::Migration[7.0]
  def change
    rename_table :company_users, :employments
  end
end
