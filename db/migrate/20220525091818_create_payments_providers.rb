# frozen_string_literal: true

class CreatePaymentsProviders < ActiveRecord::Migration[7.0]
  def change
    create_table :payments_providers do |t|
      t.string :name, null: false
      t.boolean :connected, default: false
      t.boolean :enabled, default: false
      t.string :accepted_payment_methods, array: true, default: []
      t.references :company, null: false, foreign_key: true
      t.index [:name, :company_id], unique: true

      t.timestamps
    end
  end
end
