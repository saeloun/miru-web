# frozen_string_literal: true

class ValidateHiringDecisionMessages < ActiveRecord::Migration[8.1]
  def up
    validate_check_constraint :hiring_messages, name: "hiring_message_kind"
    validate_check_constraint :hiring_messages, name: "hiring_message_event"
  end

  def down; end
end
