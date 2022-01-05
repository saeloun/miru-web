# frozen_string_literal: true

class CreateCompany < ActiveRecord::Migration[7.0]
  def up
    create_table :companies do |t|
      t.string "name"
      t.text "address"
      t.text "business_phone"
      t.text "base_currency"
      t.decimal "standard_price", precision: 6, scale: 2
      t.string "fiscal_year_end"
      t.date "date"
      t.string "country"
      t.string "timezone"

      t.timestamps
    end
  end

  def down
    drop_table :companies
  end
end
