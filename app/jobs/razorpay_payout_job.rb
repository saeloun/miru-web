# frozen_string_literal: true

class RazorpayPayoutJob < ApplicationJob
  queue_as :default

  def perform(payment_id)
    payment = Payment.find(payment_id)
    PaymentProviders::RazorpayWithdrawalService.new(payment:, automatic: true).process
  end
end
