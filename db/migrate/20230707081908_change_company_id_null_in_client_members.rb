# frozen_string_literal: true

class ChangeCompanyIdNullInClientMembers < ActiveRecord::Migration[7.0]
  def change
    add_check_constraint :client_members, "company_id IS NOT NULL", name: "client_members_company_id_null",
      validate: false
  end
end
