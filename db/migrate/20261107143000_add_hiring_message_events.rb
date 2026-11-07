# frozen_string_literal: true

class AddHiringMessageEvents < ActiveRecord::Migration[8.1]
  def up
    add_column :hiring_messages, :event_key, :string, null: false, default: "acknowledgement"
    remove_check_constraint :hiring_messages, name: "hiring_message_kind"
    add_check_constraint :hiring_messages, "kind IN ('acknowledgement', 'interview_invitation', 'interview_confirmation', 'interview_reschedule', 'interview_cancellation')", name: "hiring_message_kind", validate: false
    add_check_constraint :hiring_messages, "(kind = 'acknowledgement' AND event_key = 'acknowledgement') OR (kind <> 'acknowledgement' AND event_key ~ '^booking:[1-9][0-9]{0,18}$')", name: "hiring_message_event", validate: false
  end

  def down
    if select_value("SELECT EXISTS (SELECT 1 FROM hiring_messages WHERE kind <> 'acknowledgement')")
      raise ActiveRecord::IrreversibleMigration, "Preserve recorded interview communications before rolling back."
    end

    remove_check_constraint :hiring_messages, name: "hiring_message_event"
    remove_check_constraint :hiring_messages, name: "hiring_message_kind"
    add_check_constraint :hiring_messages, "kind = 'acknowledgement'", name: "hiring_message_kind", validate: false
    remove_column :hiring_messages, :event_key
  end
end
