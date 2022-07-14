# frozen_string_literal: true

class AddPaymentInfoToInvoice < ActiveRecord::Migration[7.0]
  def change
    add_column :invoices, :payment_infos, :jsonb, default: {}
  end
end
