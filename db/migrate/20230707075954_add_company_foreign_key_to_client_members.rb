# frozen_string_literal: true

class AddCompanyForeignKeyToClientMembers < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_foreign_key :client_members, :companies, column: :company_id, validate: false
  end
end
