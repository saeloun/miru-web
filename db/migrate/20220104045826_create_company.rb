# frozen_string_literal: true

class CreateCompany < ActiveRecord::Migration[7.0]
  def up
    create_table :companies do |t|
      t.string "name", null: false
      t.text "address", null: false
      t.string "business_phone"
      t.string "base_currency", null: false, default: "USD"
      t.decimal "standard_price", null: false, default: 0
      t.string "fiscal_year_end"
      t.string "date_format"
      t.string "country", null: false
      t.string "timezone"

      t.timestamps
    end
  end

  def down
    drop_table :companies
  end
end
