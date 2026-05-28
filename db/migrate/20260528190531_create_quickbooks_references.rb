# frozen_string_literal: true

class CreateQuickbooksReferences < ActiveRecord::Migration[8.1]
  def change
    create_table :quickbooks_references do |t|
      t.references :company, null: false, foreign_key: true
      t.references :quickbooks_connection, null: false, foreign_key: true
      t.string :miru_record_type, null: false
      t.bigint :miru_record_id, null: false
      t.string :quickbooks_entity_type, null: false
      t.string :quickbooks_entity_id, null: false
      t.string :quickbooks_sync_token
      t.datetime :last_synced_at
      t.datetime :last_seen_in_quickbooks_at
      t.integer :direction, null: false, default: 2
      t.integer :status, null: false, default: 0
      t.string :payload_digest
      t.text :last_error

      t.timestamps
    end

    add_index :quickbooks_references,
      [:company_id, :miru_record_type, :miru_record_id, :quickbooks_entity_type],
      unique: true,
      name: "idx_qbo_refs_miru_record_entity"

    add_index :quickbooks_references,
      [:quickbooks_connection_id, :quickbooks_entity_type, :quickbooks_entity_id],
      unique: true,
      name: "idx_qbo_refs_qbo_entity"
  end
end
