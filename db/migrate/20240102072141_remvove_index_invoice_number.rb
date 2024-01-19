# frozen_string_literal: true

class RemvoveIndexInvoiceNumber < ActiveRecord::Migration[7.0]
  def change
    remove_index :invoices, name: "index_invoices_on_invoice_number"
  end
end
