# frozen_string_literal: true

class AddStripeEnabledToInvoices < ActiveRecord::Migration[7.0]
  def change
    add_column :invoices, :stripe_enabled, :boolean, default: true
  end
end
