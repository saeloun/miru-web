# frozen_string_literal: true

class AddIndexOnNameAndClientOnProjects < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!
  def change
    add_index :projects, [:name, :client_id], unique: true, algorithm: :concurrently
  end
end
