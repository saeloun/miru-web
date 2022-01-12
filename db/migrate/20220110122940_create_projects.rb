# frozen_string_literal: true

class CreateProjects < ActiveRecord::Migration[7.0]
  def up
    create_table :projects do |t|
      t.references :client, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description, null: false
      t.integer :bill_status, null: false

      t.timestamps
    end
  end

  def down
    drop_table :projects
  end
end
