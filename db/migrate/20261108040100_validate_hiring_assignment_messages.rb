# frozen_string_literal: true

class ValidateHiringAssignmentMessages < ActiveRecord::Migration[8.1]
  def up
    validate_check_constraint :hiring_messages, name: "hiring_message_kind"
    validate_check_constraint :hiring_messages, name: "hiring_message_event"
  end

  def down
    if select_value("SELECT EXISTS (SELECT 1 FROM hiring_messages WHERE kind = 'assignment' OR event_key LIKE 'assignment:%')")
      raise ActiveRecord::IrreversibleMigration, "Preserve recorded assignment messages before rolling back."
    end
  end
end
