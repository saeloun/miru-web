# frozen_string_literal: true

class CreateClients < ActiveRecord::Migration[7.0]
  def up
    create_table :clients do |t|
      t.string :name, null: false
      t.string :email, null: false, unique: true
      t.string :phone
      t.string :address
      t.string :country
      t.string :timezone

      t.timestamps
    end
  end

  def down
    drop_table :clients
  end
end
