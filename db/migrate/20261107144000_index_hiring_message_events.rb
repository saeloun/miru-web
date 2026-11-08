# frozen_string_literal: true

class IndexHiringMessageEvents < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def up
    validate_check_constraint :hiring_messages, name: "hiring_message_kind"
    validate_check_constraint :hiring_messages, name: "hiring_message_event"
    add_index :hiring_messages, [:company_id, :hiring_application_id, :kind, :event_key], unique: true,
      where: "original_message_id IS NULL", name: "index_hiring_messages_on_original_operation", algorithm: :concurrently
    remove_index :hiring_messages, name: "index_hiring_messages_on_original_event", algorithm: :concurrently
  end

  def down
    if select_value("SELECT EXISTS (SELECT 1 FROM hiring_messages WHERE kind <> 'acknowledgement')")
      raise ActiveRecord::IrreversibleMigration, "Preserve recorded interview communications before rolling back."
    end

    add_index :hiring_messages, [:company_id, :hiring_application_id, :kind], unique: true,
      where: "original_message_id IS NULL", name: "index_hiring_messages_on_original_event", algorithm: :concurrently
    remove_index :hiring_messages, name: "index_hiring_messages_on_original_operation", algorithm: :concurrently
  end
end
