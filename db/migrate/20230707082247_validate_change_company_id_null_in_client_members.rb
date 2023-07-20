# frozen_string_literal: true

class ValidateChangeCompanyIdNullInClientMembers < ActiveRecord::Migration[7.0]
  def up
    validate_check_constraint :client_members, name: "client_members_company_id_null"
    change_column_null :client_members, :company_id, false
    remove_check_constraint :client_members, name: "client_members_company_id_null"
  end

  def down
    add_check_constraint :client_members, "company_id IS NOT NULL", name: "client_members_company_id_null",
      validate: false
    change_column_null :client_members, :company_id, true
  end
end
