# frozen_string_literal: true

class AddRolesToUser < ActiveRecord::Migration[7.0]
  def up
    add_column :users, :role, :integer, null: false
  end

  def down
    remove_column :users, :role
  end
end
