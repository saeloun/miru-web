# frozen_string_literal: true

class FixQuickbooksExportIndexes < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  REFERENCE_INDEX_NAME = "idx_qbo_refs_miru_record_entity"
  REFERENCE_TMP_INDEX_NAME = "tmp_idx_qbo_refs_miru_record_entity"
  EVENTS_INDEX_NAME = "idx_qbo_events_idempotency"
  EVENTS_TMP_INDEX_NAME = "tmp_idx_qbo_events_idempotency"

  def up
    add_index :quickbooks_references,
      [:quickbooks_connection_id, :miru_record_type, :miru_record_id, :quickbooks_entity_type],
      unique: true,
      name: REFERENCE_TMP_INDEX_NAME,
      algorithm: :concurrently
    remove_index :quickbooks_references, name: REFERENCE_INDEX_NAME, algorithm: :concurrently
    rename_index :quickbooks_references, REFERENCE_TMP_INDEX_NAME, REFERENCE_INDEX_NAME

    change_column_null :quickbooks_sync_events, :payload_digest, false
    add_index :quickbooks_sync_events,
      [:quickbooks_connection_id, :quickbooks_entity_type, :quickbooks_entity_id, :payload_digest],
      unique: true,
      where: "status = 1",
      name: EVENTS_TMP_INDEX_NAME,
      algorithm: :concurrently
    remove_index :quickbooks_sync_events, name: EVENTS_INDEX_NAME, algorithm: :concurrently
    rename_index :quickbooks_sync_events, EVENTS_TMP_INDEX_NAME, EVENTS_INDEX_NAME
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "legacy QuickBooks export indexes are not data-safe to restore"
  end
end
