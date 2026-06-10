# frozen_string_literal: true

class AddQuickbooksTenantForeignKeys < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_index :quickbooks_connections,
      [:id, :company_id],
      unique: true,
      name: "idx_qbo_connections_id_company",
      algorithm: :concurrently

    add_index :quickbooks_sync_runs,
      [:id, :quickbooks_connection_id, :company_id],
      unique: true,
      name: "idx_qbo_runs_id_connection_company",
      algorithm: :concurrently

    add_foreign_key :quickbooks_references,
      :quickbooks_connections,
      column: [:quickbooks_connection_id, :company_id],
      primary_key: [:id, :company_id],
      name: "fk_qbo_refs_connection_company",
      validate: false
    validate_foreign_key :quickbooks_references, name: "fk_qbo_refs_connection_company"

    add_foreign_key :quickbooks_sync_runs,
      :quickbooks_connections,
      column: [:quickbooks_connection_id, :company_id],
      primary_key: [:id, :company_id],
      name: "fk_qbo_runs_connection_company",
      validate: false
    validate_foreign_key :quickbooks_sync_runs, name: "fk_qbo_runs_connection_company"

    add_foreign_key :quickbooks_sync_events,
      :quickbooks_connections,
      column: [:quickbooks_connection_id, :company_id],
      primary_key: [:id, :company_id],
      name: "fk_qbo_events_connection_company",
      validate: false
    validate_foreign_key :quickbooks_sync_events, name: "fk_qbo_events_connection_company"

    add_foreign_key :quickbooks_sync_events,
      :quickbooks_sync_runs,
      column: [:quickbooks_sync_run_id, :quickbooks_connection_id, :company_id],
      primary_key: [:id, :quickbooks_connection_id, :company_id],
      name: "fk_qbo_events_run_connection_company",
      validate: false
    validate_foreign_key :quickbooks_sync_events, name: "fk_qbo_events_run_connection_company"
  end
end
