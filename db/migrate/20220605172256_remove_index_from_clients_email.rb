# frozen_string_literal: true

class RemoveIndexFromClientsEmail < ActiveRecord::Migration[7.0]
  def change
    remove_index :clients, name: "index_clients_on_email_and_company_id"
  end
end
