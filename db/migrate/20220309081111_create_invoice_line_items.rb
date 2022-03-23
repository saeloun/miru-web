# frozen_string_literal: true

class CreateInvoiceLineItems < ActiveRecord::Migration[7.0]
  def change
    create_table :invoice_line_items do |t|
      t.string :name
      t.text :description
      t.date :date
      t.decimal :rate, scale: 2, precision: 20, default: 0.0
      t.integer :quantity, default: 1
      t.references :user, null: false, foreign_key: true
      t.references :invoice, null: false, foreign_key: true
      t.references :timesheet_entry, foreign_key: true

      t.timestamps
    end
  end
end
