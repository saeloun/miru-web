# frozen_string_literal: true

class AddUsTaxFieldsToCompanies < ActiveRecord::Migration[8.0]
  def change
    add_column :companies, :ein, :string
    add_column :companies, :us_taxpayer_id, :string
  end
end
