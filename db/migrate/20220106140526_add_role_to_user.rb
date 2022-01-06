# frozen_string_literal: true

class AddRoleToUser < ActiveRecord::Migration[7.0]
  def up
    add_column :users, :role, :integer
  end

  def down
    drop_coloumn :users, :role
  end
end
