# frozen_string_literal: true

class AllowUnbookedHiringInvitations < ActiveRecord::Migration[8.1]
  def up
    remove_check_constraint :hiring_messages, name: "hiring_message_event"
    add_check_constraint :hiring_messages, "(kind = 'acknowledgement' AND event_key = 'acknowledgement') OR " \
      "(kind <> 'acknowledgement' AND event_key ~ '^booking:[1-9][0-9]{0,18}$') OR " \
      "(kind = 'interview_invitation' AND event_key ~ '^round:[1-9][0-9]{0,18}:[0-9]{1,10}$')",
      name: "hiring_message_event", validate: false
  end

  def down
    if select_value("SELECT EXISTS (SELECT 1 FROM hiring_messages WHERE event_key LIKE 'round:%')")
      raise ActiveRecord::IrreversibleMigration, "Preserve recorded unbooked invitations before rolling back."
    end

    remove_check_constraint :hiring_messages, name: "hiring_message_event"
    add_check_constraint :hiring_messages, "(kind = 'acknowledgement' AND event_key = 'acknowledgement') OR " \
      "(kind <> 'acknowledgement' AND event_key ~ '^booking:[1-9][0-9]{0,18}$')", name: "hiring_message_event", validate: false
  end
end
