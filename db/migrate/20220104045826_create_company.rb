# frozen_string_literal: true

class CreateCompany < ActiveRecord::Migration[7.0]
  def change
    create_table :companies do |t|
      t.string "name"
      t.text "address"
      t.integer "business_phone"
      t.decimal "base_currency"
      t.decimal "standard_price"
      t.string "fiscal_year_end"
      t.date "date"

      t.timestamps
    end
  end
end
