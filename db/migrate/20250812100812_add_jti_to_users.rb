# frozen_string_literal: true

class AddJtiToUsers < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def change
    add_column :users, :jti, :string
    add_index :users, :jti, algorithm: :concurrently
  end
end
