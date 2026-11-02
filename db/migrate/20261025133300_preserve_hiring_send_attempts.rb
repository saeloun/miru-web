# frozen_string_literal: true

class PreserveHiringSendAttempts < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def up
    add_column :hiring_messages, :original_message_id, :bigint
    add_column :hiring_messages, :attempt_number, :integer, null: false, default: 1
    add_column :hiring_messages, :resolution, :string, limit: 32
    add_column :hiring_messages, :resolution_details, :text
    add_column :hiring_messages, :resolved_by_id, :bigint
    add_column :hiring_messages, :resolved_at, :datetime
    add_index :hiring_messages, :resolved_by_id, algorithm: :concurrently
    add_index :hiring_messages, [:company_id, :hiring_application_id, :id], unique: true, algorithm: :concurrently,
      name: "index_hiring_messages_on_tenant_application_id"
    add_index :hiring_messages, [:company_id, :original_message_id, :attempt_number], unique: true,
      where: "original_message_id IS NOT NULL", algorithm: :concurrently, name: "index_hiring_messages_on_retry_attempt"
    add_index :hiring_messages, [:company_id, :hiring_application_id, :kind], unique: true,
      where: "original_message_id IS NULL", algorithm: :concurrently, name: "index_hiring_messages_on_original_event"
    remove_index :hiring_messages, name: "index_hiring_messages_on_application_event", algorithm: :concurrently
    add_foreign_key :hiring_messages, :hiring_messages, column: [:company_id, :hiring_application_id, :original_message_id],
      primary_key: [:company_id, :hiring_application_id, :id], on_delete: :cascade, validate: false, name: "hiring_message_original"
    validate_foreign_key :hiring_messages, name: "hiring_message_original"
    add_foreign_key :hiring_messages, :users, column: :resolved_by_id, on_delete: :nullify, validate: false
    validate_foreign_key :hiring_messages, :users, column: :resolved_by_id
    add_check_constraint :hiring_messages,
      "(original_message_id IS NULL AND attempt_number = 1) OR (original_message_id IS NOT NULL AND original_message_id <> id AND attempt_number > 1)",
      name: "hiring_message_attempt", validate: false
    validate_check_constraint :hiring_messages, name: "hiring_message_attempt"
    add_check_constraint :hiring_messages,
      "(resolution IS NULL AND resolved_at IS NULL AND resolved_by_id IS NULL AND resolution_details IS NULL) OR (resolution IS NOT NULL AND resolution IN ('accepted', 'not_accepted') AND resolved_at IS NOT NULL AND resolution_details IS NOT NULL)",
      name: "hiring_message_resolution", validate: false
    validate_check_constraint :hiring_messages, name: "hiring_message_resolution"
  end

  def down
    if select_value("SELECT 1 FROM hiring_messages WHERE original_message_id IS NOT NULL OR resolution IS NOT NULL LIMIT 1")
      raise ActiveRecord::IrreversibleMigration, "Retain recorded send attempts and reconciliation evidence before rolling back."
    end

    add_index :hiring_messages, [:company_id, :hiring_application_id, :kind], unique: true,
      algorithm: :concurrently, name: "index_hiring_messages_on_application_event"
    remove_check_constraint :hiring_messages, name: "hiring_message_resolution"
    remove_check_constraint :hiring_messages, name: "hiring_message_attempt"
    remove_foreign_key :hiring_messages, name: "hiring_message_original"
    remove_foreign_key :hiring_messages, :users, column: :resolved_by_id
    remove_index :hiring_messages, name: "index_hiring_messages_on_original_event", algorithm: :concurrently
    remove_index :hiring_messages, name: "index_hiring_messages_on_retry_attempt", algorithm: :concurrently
    remove_index :hiring_messages, name: "index_hiring_messages_on_tenant_application_id", algorithm: :concurrently
    remove_index :hiring_messages, :resolved_by_id, algorithm: :concurrently
    remove_column :hiring_messages, :resolved_at
    remove_column :hiring_messages, :resolved_by_id
    remove_column :hiring_messages, :resolution_details
    remove_column :hiring_messages, :resolution
    remove_column :hiring_messages, :attempt_number
    remove_column :hiring_messages, :original_message_id
  end
end
