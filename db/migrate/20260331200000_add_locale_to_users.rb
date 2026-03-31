# frozen_string_literal: true

class AddLocaleToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :locale, :string, default: "en", null: false
  end
end
