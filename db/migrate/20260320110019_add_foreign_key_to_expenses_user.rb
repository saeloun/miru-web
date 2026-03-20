# frozen_string_literal: true

class AddForeignKeyToExpensesUser < ActiveRecord::Migration[8.0]
  def change
    add_foreign_key :expenses, :users, validate: false
  end
end
