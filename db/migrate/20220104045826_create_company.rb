# frozen_string_literal: true

class CreateCompany < ActiveRecord::Migration[7.0]
  def up
    create_table :companies do |t|
      t.string "name", null: false
      t.text "address", null: false
      t.string "business_phone"
      t.string "base_currency", null: false, default: "USD"
      t.decimal "standard_price", precision: 6, scale: 2, default: 0.00
      t.integer "fiscal_year_end", null: false, default: "JUN"
      t.integer "date_format", default: "MM-DD-YYYY"
      t.string "country", null: false
      t.string "timezone", default: "UTC"

      t.timestamps
    end
  end

  def down
    drop_table :companies
  end
end
