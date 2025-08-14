# frozen_string_literal: true

class AddExchangeRateDateToPayments < ActiveRecord::Migration[8.0]
  def change
    add_column :payments, :exchange_rate_date, :date
  end
end
