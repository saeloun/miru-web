# frozen_string_literal: true

class AddTokenToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :token, :string, unique: true, limit: 50
  end
end
