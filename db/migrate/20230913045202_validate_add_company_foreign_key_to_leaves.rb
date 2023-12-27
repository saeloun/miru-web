# frozen_string_literal: true

class ValidateAddCompanyForeignKeyToLeaves < ActiveRecord::Migration[7.0]
  def change
    validate_foreign_key :leaves, :companies
  end
end
