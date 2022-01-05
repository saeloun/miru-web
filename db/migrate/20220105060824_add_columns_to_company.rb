# frozen_string_literal: true

class AddColumnsToCompany < ActiveRecord::Migration[7.0]
  def up
    add_column :companies, :country, :string
    add_column :companies, :timezone, :string
  end

  def down
    remove_column :companies, :country, :string
    remove_column :companies, :timezone, :string
  end
end
