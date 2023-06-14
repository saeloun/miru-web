# frozen_string_literal: true

class AddClientMemebers < ActiveRecord::Migration[7.0]
  def change
    create_table :client_members do |t|
      t.references :client, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
