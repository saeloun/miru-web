# frozen_string_literal: true

class CreateStripeConnectedAccounts < ActiveRecord::Migration[7.0]
  def change
    create_table :stripe_connected_accounts do |t|
      t.string :account_id, null: false
      t.references :company, null: false, foreign_key: true, index: { unique: true }

      t.timestamps
    end

    add_index :stripe_connected_accounts, :account_id, unique: true
  end
end
