# frozen_string_literal: true

class ValidateUnbookedHiringInvitations < ActiveRecord::Migration[8.1]
  def up
    validate_check_constraint :hiring_messages, name: "hiring_message_event"
  end

  def down
    # Validation has no destructive inverse.
  end
end
