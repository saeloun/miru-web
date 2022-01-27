# frozen_string_literal: true

class AddStateToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :state, :integer, default: 0
  end
end
