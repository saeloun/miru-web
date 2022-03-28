# frozen_string_literal: true

class AddClientCodeToClients < ActiveRecord::Migration[7.0]
  def change
    add_column :clients, :client_code, :string
  end
end
