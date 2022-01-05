# frozen_string_literal: true

class CreateCompany < ActiveRecord::Migration[7.0]
  def up
    create_table :companies do |t|
      t.string "name", null: false
      t.text "address", null: false
      t.string "business_phone", null: false
      t.string "base_currency", null: false
      t.decimal "standard_price", precision: 6, scale: 2, default: 0.00
      t.string "fiscal_year_end", null: false
      t.integer "date_format", default: 1
      t.string "country", null: false
      t.decimal "timezone", null: false, default: 0.00, precision: 4, scale: 2

      t.timestamps
    end
  end

  def down
    drop_table :companies
  end
end
