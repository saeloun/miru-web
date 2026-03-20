# frozen_string_literal: true

class AddBankAndTaxInfoToCompanies < ActiveRecord::Migration[8.0]
  def change
    add_column :companies, :bank_name, :string
    add_column :companies, :bank_account_number, :string
    add_column :companies, :bank_routing_number, :string
    add_column :companies, :bank_swift_code, :string
    add_column :companies, :tax_id, :string
    add_column :companies, :vat_number, :string
    add_column :companies, :gst_number, :string
  end
end
