# frozen_string_literal: true

class AddExternalViewKeyToInvoice < ActiveRecord::Migration[7.0]
  def change
    add_column :invoices, :external_view_key, :string
    add_index :invoices, :external_view_key, unique: true
  end
end
