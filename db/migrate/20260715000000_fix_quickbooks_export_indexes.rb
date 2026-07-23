# frozen_string_literal: true

class FixQuickbooksExportIndexes < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  REFERENCE_COLUMNS = [:quickbooks_connection_id, :miru_record_type, :miru_record_id, :quickbooks_entity_type].freeze
  REFERENCE_INDEX_NAME = "idx_qbo_refs_miru_record_entity"
  REFERENCE_TMP_INDEX_NAME = "tmp_idx_qbo_refs_miru_record_entity"
  EVENTS_COLUMNS = [:quickbooks_connection_id, :quickbooks_entity_type, :quickbooks_entity_id, :payload_digest].freeze
  EVENTS_INDEX_NAME = "idx_qbo_events_idempotency"
  EVENTS_TMP_INDEX_NAME = "tmp_idx_qbo_events_idempotency"

  # This migration is non-transactional (concurrent indexes) and previously
  # failed partway in production, so every step must be safe to re-run.
  def up
    unless index_exists?(:quickbooks_references, REFERENCE_COLUMNS, unique: true, name: REFERENCE_INDEX_NAME)
      add_index :quickbooks_references, REFERENCE_COLUMNS,
        unique: true,
        name: REFERENCE_TMP_INDEX_NAME,
        algorithm: :concurrently,
        if_not_exists: true
      remove_index :quickbooks_references, name: REFERENCE_INDEX_NAME, algorithm: :concurrently, if_exists: true
      rename_index :quickbooks_references, REFERENCE_TMP_INDEX_NAME, REFERENCE_INDEX_NAME
    end

    # payload_digest has been NOT NULL since create_quickbooks_sync_events;
    # tightening here again blocked the deploy under strong_migrations. Only
    # environments that somehow relaxed it need action, done via a constraint
    # that is validated without locking the table.
    if connection.columns(:quickbooks_sync_events).find { |c| c.name == "payload_digest" }&.null
      safety_assured do
        add_check_constraint :quickbooks_sync_events, "payload_digest IS NOT NULL",
          name: "quickbooks_sync_events_payload_digest_null", validate: false
      end
      validate_check_constraint :quickbooks_sync_events, name: "quickbooks_sync_events_payload_digest_null"
    end

    unless index_exists?(:quickbooks_sync_events, EVENTS_COLUMNS, unique: true, name: EVENTS_INDEX_NAME)
      add_index :quickbooks_sync_events, EVENTS_COLUMNS,
        unique: true,
        where: "status = 1",
        name: EVENTS_TMP_INDEX_NAME,
        algorithm: :concurrently,
        if_not_exists: true
      remove_index :quickbooks_sync_events, name: EVENTS_INDEX_NAME, algorithm: :concurrently, if_exists: true
      rename_index :quickbooks_sync_events, EVENTS_TMP_INDEX_NAME, EVENTS_INDEX_NAME
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "legacy QuickBooks export indexes are not data-safe to restore"
  end
end
