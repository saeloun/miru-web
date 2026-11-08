# frozen_string_literal: true

class AddHiringDecisionMessages < ActiveRecord::Migration[8.1]
  def up
    add_column :hiring_settings, :rejection_automation_started_at, :datetime
    add_column :hiring_settings, :hold_notifications_started_at, :datetime
    remove_check_constraint :hiring_messages, name: "hiring_message_kind"
    remove_check_constraint :hiring_messages, name: "hiring_message_event"
    add_check_constraint :hiring_messages, "kind IN ('acknowledgement', 'interview_invitation', 'interview_confirmation', " \
      "'interview_reschedule', 'interview_cancellation', 'feedback_prompt', 'feedback_overdue', 'feedback_received', 'rejection', 'hold_follow_up')",
      name: "hiring_message_kind", validate: false
    add_check_constraint :hiring_messages, "(kind = 'acknowledgement' AND event_key = 'acknowledgement') OR " \
      "(kind IN ('interview_invitation', 'interview_confirmation', 'interview_reschedule', 'interview_cancellation') AND event_key ~ '^booking:[1-9][0-9]{0,18}$') OR " \
      "(kind = 'interview_invitation' AND event_key ~ '^round:[1-9][0-9]{0,18}:[0-9]{1,10}$') OR " \
      "(kind IN ('feedback_prompt', 'feedback_overdue', 'feedback_received') AND event_key ~ '^feedback:[1-9][0-9]{0,18}$') OR " \
      "(kind IN ('rejection', 'hold_follow_up') AND event_key ~ '^decision:[1-9][0-9]{0,18}$')",
      name: "hiring_message_event", validate: false
  end

  def down
    if select_value("SELECT EXISTS (SELECT 1 FROM hiring_messages WHERE event_key LIKE 'decision:%')") ||
        select_value("SELECT EXISTS (SELECT 1 FROM hiring_settings WHERE rejection_automation_started_at IS NOT NULL OR hold_notifications_started_at IS NOT NULL)")
      raise ActiveRecord::IrreversibleMigration, "Preserve decision messages and activated automation before rolling back."
    end

    remove_check_constraint :hiring_messages, name: "hiring_message_kind"
    remove_check_constraint :hiring_messages, name: "hiring_message_event"
    add_check_constraint :hiring_messages, "kind IN ('acknowledgement', 'interview_invitation', 'interview_confirmation', 'interview_reschedule', " \
      "'interview_cancellation', 'feedback_prompt', 'feedback_overdue', 'feedback_received')", name: "hiring_message_kind"
    add_check_constraint :hiring_messages, "(kind = 'acknowledgement' AND event_key = 'acknowledgement') OR " \
      "(kind IN ('interview_invitation', 'interview_confirmation', 'interview_reschedule', 'interview_cancellation') AND event_key ~ '^booking:[1-9][0-9]{0,18}$') OR " \
      "(kind = 'interview_invitation' AND event_key ~ '^round:[1-9][0-9]{0,18}:[0-9]{1,10}$') OR " \
      "(kind IN ('feedback_prompt', 'feedback_overdue', 'feedback_received') AND event_key ~ '^feedback:[1-9][0-9]{0,18}$')", name: "hiring_message_event"
    remove_column :hiring_settings, :rejection_automation_started_at
    remove_column :hiring_settings, :hold_notifications_started_at
  end
end
