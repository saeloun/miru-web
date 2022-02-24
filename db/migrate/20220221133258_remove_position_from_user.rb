# frozen_string_literal: true

class RemovePositionFromUser < ActiveRecord::Migration[7.0]
  def change
    remove_column :users, :position, :string
  end
end
