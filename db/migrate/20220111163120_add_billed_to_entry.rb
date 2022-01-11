# frozen_string_literal: true

class AddBilledToEntry < ActiveRecord::Migration[7.0]
  def up
    add_column :entries, :billed, :boolean, default: false
  end

  def down
    remove_column :entries, :billed
  end
end
