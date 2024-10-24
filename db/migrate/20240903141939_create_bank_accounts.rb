# frozen_string_literal: true

class CreateBankAccounts < ActiveRecord::Migration[7.1]
  def change
    create_table :bank_accounts do |t|
      t.references :company, null: false, foreign_key: true
      t.string :routing_number, null: false
      t.string :account_number, null: false
      t.string :account_type, null: false
      t.string :bank_name, null: false
      t.timestamps
    end
  end
end
