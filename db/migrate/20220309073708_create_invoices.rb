# frozen_string_literal: true

class CreateInvoices < ActiveRecord::Migration[7.0]
  def change
    create_table :invoices do |t|
      t.date :issue_date
      t.date :due_date
      t.string :invoice_number
      t.text :reference
      t.float :amount
      t.float :outstanding_amount
      t.float :sub_total
      t.float :tax
      t.float :amount_paid
      t.float :amount_due
      t.references :company, null: false, foreign_key: true
      t.references :client, null: false, foreign_key: true

      t.timestamps
    end

    add_index :invoices, [:company_id, :client_id], unique: true
  end
end
