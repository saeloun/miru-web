# frozen_string_literal: true

class AddDiscardToInvoices < ActiveRecord::Migration[7.0]
  def change
    add_column :invoices, :discarded_at, :datetime
    add_index :invoices, :discarded_at
  end
end
