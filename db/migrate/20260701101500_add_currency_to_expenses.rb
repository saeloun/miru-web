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
    end
  end

  def down
    remove_column :expenses, :currency
  end
end
