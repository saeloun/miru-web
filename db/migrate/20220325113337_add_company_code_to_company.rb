# frozen_string_literal: true

class AddCompanyCodeToCompany < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :company_code, :string, null: false
  end
end
