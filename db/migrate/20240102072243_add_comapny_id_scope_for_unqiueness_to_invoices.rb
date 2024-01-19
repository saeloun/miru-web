# frozen_string_literal: true

class AddComapnyIdScopeForUnqiuenessToInvoices < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :invoices, [:invoice_number, :company_id], unique: true, algorithm: :concurrently
  end
end
