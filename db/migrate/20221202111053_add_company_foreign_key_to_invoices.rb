# frozen_string_literal: true

class AddCompanyForeignKeyToInvoices < ActiveRecord::Migration[7.0]
  def up
    add_reference :invoices, :company, foreign_key: true

    Invoice.where(company_id: nil).each do |invoice|
      invoice.update!(company_id: invoice.client.company.id)
    end
  end

  def down
    remove_reference :invoices, :companies
  end
end
