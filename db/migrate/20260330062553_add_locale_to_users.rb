# frozen_string_literal: true

class AddLocaleToUsers < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_column :users, :locale, :string, default: "en", null: false
    add_index :users, :locale, algorithm: :concurrently
  end
end
