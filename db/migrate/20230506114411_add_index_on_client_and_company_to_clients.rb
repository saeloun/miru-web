# frozen_string_literal: true

class AddIndexOnClientAndCompanyToClients < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!
  def change
    add_index :clients, [:name, :company_id], unique: true, algorithm: :concurrently
  end
end
