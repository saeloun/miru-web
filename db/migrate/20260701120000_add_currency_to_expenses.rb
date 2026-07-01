# frozen_string_literal: true

class AddCurrencyToExpenses < ActiveRecord::Migration[8.0]
  def up
    add_column :expenses, :currency, :string

    safety_assured do
      execute <<~SQL.squish
        UPDATE expenses
        SET currency = COALESCE(NULLIF(companies.base_currency, ''), 'USD')
        FROM companies
        WHERE expenses.company_id = companies.id
          AND expenses.currency IS NULL
      SQL

      execute <<~SQL.squish
        UPDATE expenses
        SET currency = 'USD'
        WHERE currency IS NULL
      SQL

      change_column_default :expenses, :currency, from: nil, to: "USD"
      change_column_null :expenses, :currency, false
      add_check_constraint :expenses, "currency ~ '^[A-Z]{3}$'", name: "expenses_currency_iso_code"
    end
  end

  def down
    remove_check_constraint :expenses, name: "expenses_currency_iso_code"
    remove_column :expenses, :currency
  end
end
