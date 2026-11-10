# frozen_string_literal: true

class PayrollProfileCompletionRecoveryJob < ApplicationJob
  # Recover unattempted queue failures while treating interrupted sends as uncertain.
  def perform
    PayrollProfileCompletionRequest.where(state: "sending", attempted_at: ..15.minutes.ago).update_all(state: "uncertain", updated_at: Time.current)
    return unless PayrollProfileCompletionMailer.perform_deliveries

    PayrollProfileCompletionRequest.where(state: "queued", created_at: ..15.minutes.ago).find_each(&:enqueue_delivery)
  end
end
