# frozen_string_literal: true

class AddCompanyForeignKeyToInvoices < ActiveRecord::Migration[7.0]
  def up
    add_reference :invoices, :company, foreign_key: true

    Client.all.each do |client|
      client.invoices.update_all(company_id: client.company_id)
    end
  end

  def down
    remove_reference :invoices, :companies
  end
end
