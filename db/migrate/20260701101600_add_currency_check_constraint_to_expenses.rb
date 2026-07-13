# frozen_string_literal: true

class AddCurrencyCheckConstraintToExpenses < ActiveRecord::Migration[8.0]
  def change
    add_check_constraint :expenses,
      "currency IS NOT NULL AND currency ~ '^[A-Z]{3}$'",
      name: "expenses_currency_iso_code",
      validate: false
  end
end
