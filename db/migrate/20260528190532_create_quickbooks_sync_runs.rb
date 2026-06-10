# frozen_string_literal: true

class CreateQuickbooksSyncRuns < ActiveRecord::Migration[8.1]
  def change
    create_table :quickbooks_sync_runs do |t|
      t.references :company, null: false, foreign_key: true
      t.references :quickbooks_connection, null: false, foreign_key: true
      t.integer :direction, null: false, default: 2
      t.integer :trigger, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.datetime :started_at
      t.datetime :finished_at
      t.jsonb :summary, null: false, default: {}
      t.text :error

      t.timestamps
    end

    add_index :quickbooks_sync_runs, [:company_id, :status]
    add_index :quickbooks_sync_runs, [:quickbooks_connection_id, :created_at]
  end
end
