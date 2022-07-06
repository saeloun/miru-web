# frozen_string_literal: true

class AddStripePaymentIntentToInvoice < ActiveRecord::Migration[7.0]
  def change
    add_column :invoices, :stripe_payment_intent, :string
  end
end
