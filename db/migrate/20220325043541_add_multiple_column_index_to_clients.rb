# frozen_string_literal: true

class AddMultipleColumnIndexToClients < ActiveRecord::Migration[7.0]
  def change
    add_index :clients, [:client_code, :company_id], unique: true
  end
end
