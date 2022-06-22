# frozen_string_literal: true

class CreateDevices < ActiveRecord::Migration[7.0]
  def change
    create_table :devices do |t|
      t.references :user, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.string :device_type, default: "laptop"
      t.string :model
      t.string :serial_number
      t.jsonb :specifications

      t.timestamps
    end
  end
end
