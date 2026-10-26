# frozen_string_literal: true

class CreateProfitabilityScenarios < ActiveRecord::Migration[8.0]
  def change
    create_table :profitability_scenarios do |t|
      t.references :company, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.text :name, null: false
      t.text :worksheet, null: false
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
  end
end
