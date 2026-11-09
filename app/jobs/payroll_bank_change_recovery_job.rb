# frozen_string_literal: true

class PayrollBankChangeRecoveryJob < ApplicationJob
  def perform
    PayrollBankChangeNotice.where(state: "sending", attempted_at: ..15.minutes.ago).update_all(state: "uncertain", updated_at: Time.current)
    return unless PayrollBankChangeMailer.perform_deliveries

    PayrollBankChangeNotice.where(state: "queued", created_at: ..15.minutes.ago).find_each(&:enqueue_delivery)
  end
end
