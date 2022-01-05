# frozen_string_literal: true

class CreateCompany < ActiveRecord::Migration[7.0]
  def change
    create_table :companies do |t|
      t.string "name"
      t.text "address"
      t.text "business_phone"
      t.text "base_currency"
      t.decimal "standard_price"
      t.string "fiscal_year_end"
      t.date "date"
      t.string "country"
      t.string "timezone"

      t.timestamps
    end
  end
end
