# frozen_string_literal: true

class AddSignatureDeliveryOperations < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_reference :signature_request_revisions, :signature_connection, index: { algorithm: :concurrently }
    add_foreign_key :signature_request_revisions, :signature_connections, validate: false
    add_column :signature_request_revisions, :provider_status, :string
    add_column :signature_request_revisions, :provider_checked_at, :datetime
    add_column :signature_request_revisions, :recipient_statuses, :text
    add_column :signature_request_revisions, :cancel_requested_at, :datetime
    add_column :signature_request_revisions, :last_reminder_at, :datetime
    add_column :signature_request_revisions, :next_reminder_at, :datetime
    add_column :signature_request_revisions, :automatic_reminders_count, :integer, null: false, default: 0
    add_index :signature_request_revisions, :next_reminder_at, where: "next_reminder_at IS NOT NULL", algorithm: :concurrently
    add_check_constraint :signature_request_revisions, "automatic_reminders_count BETWEEN 0 AND 3",
      name: "signature_revisions_reminder_count", validate: false

    create_table :signature_operations do |t|
      t.references :revision, null: false, foreign_key: { to_table: :signature_request_revisions }
      t.references :requested_by, null: false, foreign_key: { to_table: :users }
      t.string :key, null: false, limit: 36
      t.string :kind, null: false
      t.string :state, null: false, default: "queued"
      t.string :phase, null: false, default: "preparing"
      t.string :run_token, limit: 36
      t.string :provider_candidate, limit: 200
      t.string :error_code
      t.boolean :automatic, null: false, default: false
      t.datetime :finished_at
      t.timestamps
    end
    add_index :signature_operations, :key, unique: true
    add_index :signature_operations, [:revision_id, :kind], unique: true,
      where: "kind = 'send'", name: "index_signature_operations_single_send"
    add_check_constraint :signature_operations, "kind IN ('send', 'cancel', 'remind', 'refresh')", name: "signature_operations_kind"
    add_check_constraint :signature_operations, "state IN ('queued', 'running', 'waiting', 'confirmed', 'failed', 'uncertain')",
      name: "signature_operations_state"
    add_check_constraint :signature_operations,
      "phase IN ('preparing', 'creating', 'verifying', 'distributing', 'cancelling', 'reminding', 'checking')",
      name: "signature_operations_phase"
  end
end
