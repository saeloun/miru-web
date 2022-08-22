# frozen_string_literal: true

class CreateDevices < ActiveRecord::Migration[7.0]
  def change
    create_table :devices do |t|
      t.string :name
      t.string :version
      t.string :version_id
      t.string :kind
      t.string :device_company_name
      t.boolean :available
      t.references :assignee, foreign_key: { to_table: :users }
      t.references :company, foreign_key: true

      t.timestamps
    end
  end
end
