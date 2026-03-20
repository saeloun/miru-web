# frozen_string_literal: true

class AddBillingFieldsToCompanies < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def change
    add_column :companies, :plan_tier, :string, default: "free", null: false
    add_column :companies, :billing_exempt, :boolean, default: false, null: false
    add_column :companies, :subscription_status, :string
    add_column :companies, :subscription_ends_at, :datetime
    add_column :companies, :stripe_customer_id, :string
    add_index :companies, :stripe_customer_id, algorithm: :concurrently
  end
end
