# frozen_string_literal: true

class CreateInvoiceLineItems < ActiveRecord::Migration[7.0]
  def change
    create_table :invoice_line_items do |t|
      t.string :name
      t.text :description
      t.date :date
      t.float :rate
      t.integer :quantity
      t.references :user, null: false, foreign_key: true
      t.references :invoice, null: false, foreign_key: true
      t.references :timesheet_entry, foreign_key: true

      t.timestamps
    end
  end
end
