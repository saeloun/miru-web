# frozen_string_literal: true

class CreateQuickbooksSyncEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :quickbooks_sync_events do |t|
      t.references :company, null: false, foreign_key: true
      t.references :quickbooks_connection, null: false, foreign_key: true
      t.references :quickbooks_sync_run, foreign_key: true
      t.integer :source, null: false, default: 0
      t.string :quickbooks_entity_type, null: false
      t.string :quickbooks_entity_id, null: false
      t.string :operation
      t.string :payload_digest, null: false
      t.datetime :event_time
      t.integer :status, null: false, default: 0
      t.text :error

      t.timestamps
    end

    add_index :quickbooks_sync_events,
      [:quickbooks_connection_id, :quickbooks_entity_type, :quickbooks_entity_id],
      name: "idx_qbo_events_lookup"

    add_index :quickbooks_sync_events, [:company_id, :status]
  end
end
