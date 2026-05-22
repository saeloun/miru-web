# frozen_string_literal: true

class CreateFlexibleInvoiceTaxes < ActiveRecord::Migration[8.1]
  def change
    create_table :tax_configurations do |t|
      t.references :company, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :calculation_method, null: false, default: 0
      t.decimal :value, precision: 20, scale: 4, null: false, default: 0
      t.datetime :discarded_at

      t.timestamps
    end

    add_index :tax_configurations, :discarded_at
    add_index :tax_configurations, [:company_id, :name]

    create_table :invoice_taxes do |t|
      t.references :invoice, null: false, foreign_key: true
      t.references :tax_configuration, foreign_key: true
      t.string :name, null: false
      t.integer :calculation_method, null: false, default: 0
      t.decimal :value, precision: 20, scale: 4, null: false, default: 0
      t.decimal :amount, precision: 20, scale: 2, null: false, default: 0

      t.timestamps
    end

    add_index :invoice_taxes, [:invoice_id, :tax_configuration_id]
  end
end
