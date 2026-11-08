# frozen_string_literal: true

class AddHiringAssignmentMessages < ActiveRecord::Migration[8.1]
  def up
    replace_constraints(assignments: true, validate: false)
  end

  def down
    if select_value("SELECT EXISTS (SELECT 1 FROM hiring_messages WHERE kind = 'assignment' OR event_key LIKE 'assignment:%')")
      raise ActiveRecord::IrreversibleMigration, "Preserve recorded assignment messages before rolling back."
    end

    replace_constraints(assignments: false, validate: true)
  end

  private

    def replace_constraints(assignments:, validate:)
      kinds = %w[acknowledgement interview_invitation interview_confirmation interview_reschedule interview_cancellation
        feedback_prompt feedback_overdue feedback_received rejection hold_follow_up offer]
      kinds << "assignment" if assignments
      events = "(kind = 'acknowledgement' AND event_key = 'acknowledgement') OR " \
        "(kind IN ('interview_invitation', 'interview_confirmation', 'interview_reschedule', 'interview_cancellation') AND event_key ~ '^booking:[1-9][0-9]{0,18}$') OR " \
        "(kind = 'interview_invitation' AND event_key ~ '^round:[1-9][0-9]{0,18}:[0-9]{1,10}$') OR " \
        "(kind IN ('feedback_prompt', 'feedback_overdue', 'feedback_received') AND event_key ~ '^feedback:[1-9][0-9]{0,18}$') OR " \
        "(kind IN ('rejection', 'hold_follow_up') AND event_key ~ '^decision:[1-9][0-9]{0,18}$') OR " \
        "(kind = 'offer' AND event_key ~ '^offer:[1-9][0-9]{0,18}$')"
      events += " OR (kind = 'assignment' AND event_key ~ '^assignment:[1-9][0-9]{0,18}$')" if assignments
      remove_check_constraint :hiring_messages, name: "hiring_message_kind"
      remove_check_constraint :hiring_messages, name: "hiring_message_event"
      add_check_constraint :hiring_messages, "kind IN (#{kinds.map { |kind| "'#{kind}'" }.join(', ')})", name: "hiring_message_kind", validate: validate
      add_check_constraint :hiring_messages, events, name: "hiring_message_event", validate: validate
    end
end
