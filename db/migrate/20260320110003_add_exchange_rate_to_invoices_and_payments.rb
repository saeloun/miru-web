# frozen_string_literal: true

class AddExchangeRateToInvoicesAndPayments < ActiveRecord::Migration[8.0]
  def change
    # Add exchange rate to invoices (rate from invoice currency to base currency)
    add_column :invoices, :exchange_rate, :decimal, precision: 18, scale: 10
    add_column :invoices, :exchange_rate_date, :date

    # Add exchange rate to payments (rate at time of payment)
    add_column :payments, :exchange_rate, :decimal, precision: 18, scale: 10
    add_column :payments, :base_currency_amount, :decimal, precision: 20, scale: 2
    add_column :payments, :payment_currency, :string

    # Update existing invoices where base_currency_amount is set but exchange_rate is not
    reversible do |dir|
      dir.up do
        safety_assured do
          execute <<-SQL
            UPDATE invoices#{' '}
            SET exchange_rate = CASE#{' '}
              WHEN amount > 0 AND base_currency_amount > 0#{' '}
              THEN base_currency_amount / amount#{' '}
              ELSE 1.0#{' '}
            END
            WHERE exchange_rate IS NULL
          SQL
        end
      end
    end
  end
end
