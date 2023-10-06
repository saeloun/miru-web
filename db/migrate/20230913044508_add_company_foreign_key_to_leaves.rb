# frozen_string_literal: true

class AddCompanyForeignKeyToLeaves < ActiveRecord::Migration[7.0]
  def change
    add_foreign_key :leaves, :companies, validate: false
  end
end
