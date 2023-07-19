# frozen_string_literal: true

class AddNameToPayments < ActiveRecord::Migration[7.0]
  def change
    add_column :payments, :name, :string
  end
end
