# frozen_string_literal: true

class CreateInvoices < ActiveRecord::Migration[7.0]
  def change
    create_table :invoices do |t|
      t.date :issue_date
      t.date :due_date
      t.string :invoice_number
      t.text :reference
      t.decimal :amount, scale: 2, precision: 20, default: 0.0
      t.decimal :outstanding_amount, scale: 2, precision: 20, default: 0.0
      t.decimal :tax, scale: 2, precision: 20, default: 0.0
      t.decimal :amount_paid, scale: 2, precision: 20, default: 0.0
      t.decimal :amount_due, scale: 2, precision: 20, default: 0.0
      t.decimal :discount, scale: 2, precision: 20, default: 0.0
      t.references :company, null: false, foreign_key: true
      t.references :client, null: false, foreign_key: true

      t.timestamps
    end

    add_index :invoices, :invoice_number, unique: true
  end
end
