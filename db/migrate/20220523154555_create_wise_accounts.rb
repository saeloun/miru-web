# frozen_string_literal: true

class CreateWiseAccounts < ActiveRecord::Migration[7.0]
  def change
    create_table :wise_accounts do |t|
      t.string :profile_id
      t.string :recipient_id
      t.string :source_currency
      t.string :target_currency
      t.references :user, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.timestamps
    end

    add_index(:wise_accounts, [:user_id, :company_id], unique: true)
  end
end
