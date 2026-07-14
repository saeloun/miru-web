# frozen_string_literal: true

class FixQuickbooksExportIndexes < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def up
    remove_index :quickbooks_references, name: "idx_qbo_refs_miru_record_entity", algorithm: :concurrently
    add_index :quickbooks_references,
      [:quickbooks_connection_id, :miru_record_type, :miru_record_id, :quickbooks_entity_type],
      unique: true,
      name: "idx_qbo_refs_miru_record_entity",
      algorithm: :concurrently

    remove_index :quickbooks_sync_events, name: "idx_qbo_events_idempotency", algorithm: :concurrently
    add_index :quickbooks_sync_events,
      [:quickbooks_connection_id, :quickbooks_entity_type, :quickbooks_entity_id, :payload_digest],
      unique: true,
      where: "status = 1",
      name: "idx_qbo_events_idempotency",
      algorithm: :concurrently
  end

  def down
    remove_index :quickbooks_references, name: "idx_qbo_refs_miru_record_entity", algorithm: :concurrently
    add_index :quickbooks_references,
      [:company_id, :miru_record_type, :miru_record_id, :quickbooks_entity_type],
      unique: true,
      name: "idx_qbo_refs_miru_record_entity",
      algorithm: :concurrently

    remove_index :quickbooks_sync_events, name: "idx_qbo_events_idempotency", algorithm: :concurrently
    add_index :quickbooks_sync_events,
      [:quickbooks_connection_id, :quickbooks_entity_type, :quickbooks_entity_id, :payload_digest],
      unique: true,
      name: "idx_qbo_events_idempotency",
      algorithm: :concurrently
  end
end
