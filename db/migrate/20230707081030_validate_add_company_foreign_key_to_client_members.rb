# frozen_string_literal: true

class ValidateAddCompanyForeignKeyToClientMembers < ActiveRecord::Migration[7.0]
  def change
    validate_foreign_key :client_members, :companies
  end
end
