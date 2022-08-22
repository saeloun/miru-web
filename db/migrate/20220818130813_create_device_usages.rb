# frozen_string_literal: true

class CreateDeviceUsages < ActiveRecord::Migration[7.0]
  def change
    create_table :device_usages do |t|
      t.boolean :approve
      t.references :created_by, foreign_key: { to_table: :users }
      t.references :device, null: false, foreign_key: true
      t.references :assignee, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end
