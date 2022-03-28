# frozen_string_literal: true

class AddIndexToStatusInInvoices < ActiveRecord::Migration[7.0]
  def change
    add_index :invoices, :status, if_not_exists: true
  end
end
