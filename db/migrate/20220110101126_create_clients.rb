# frozen_string_literal: true

class CreateClients < ActiveRecord::Migration[7.0]
  def up
    create_table :clients do |t|
      t.references :company, null: false, foreign_key: true
      t.string :name, null: false
      t.string :email
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
