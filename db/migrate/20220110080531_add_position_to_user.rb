# frozen_string_literal: true

class AddPositionToUser < ActiveRecord::Migration[7.0]
  def up
    add_column :users, :position, :string
  end

  def down
    remove_column :users, :position
  end
end
