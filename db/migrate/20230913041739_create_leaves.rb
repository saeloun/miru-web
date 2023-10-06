# frozen_string_literal: true

class CreateLeaves < ActiveRecord::Migration[7.0]
  def change
    create_table :leaves do |t|
      t.integer :year

      t.timestamps
    end
  end
end
