# frozen_string_literal: true

class ValidateCurrencyCheckConstraintOnExpenses < ActiveRecord::Migration[8.0]
  def change
    validate_check_constraint :expenses, name: "expenses_currency_iso_code"
  end
end
