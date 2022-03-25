# frozen_string_literal: true

class AddUniqueIndexToClients < ActiveRecord::Migration[7.0]
  def change
    add_index :clients, [:email, :company_id], unique: true
  end
end
