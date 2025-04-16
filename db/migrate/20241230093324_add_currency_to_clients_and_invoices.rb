# frozen_string_literal: true

class AddCurrencyToClientsAndInvoices < ActiveRecord::Migration[7.1]
  def change
    add_column :clients, :currency, :string, default: "USD", null: false
    add_column :invoices, :currency, :string, default: "USD", null: false
  end
end
