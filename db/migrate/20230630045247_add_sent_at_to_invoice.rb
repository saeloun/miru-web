# frozen_string_literal: true

class AddSentAtToInvoice < ActiveRecord::Migration[7.0]
  def change
    add_column :invoices, :sent_at, :datetime
    add_column :invoices, :payment_sent_at, :datetime
    add_column :invoices, :client_payment_sent_at, :datetime
  end
end
