# frozen_string_literal: true

class AddStripeSubscriptionFieldsToCompanies < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def change
    add_column :companies, :stripe_subscription_id, :string
    add_column :companies, :subscription_interval, :string
    add_index :companies, :stripe_subscription_id, algorithm: :concurrently
  end
end
