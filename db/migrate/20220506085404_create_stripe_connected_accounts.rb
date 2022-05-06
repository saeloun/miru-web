# frozen_string_literal: true

class CreateStripeConnectedAccounts < ActiveRecord::Migration[7.0]
  def change
    create_table :stripe_connected_accounts do |t|
      t.references :company, null: false, foreign_key: true

      t.timestamps
    end
  end
end
