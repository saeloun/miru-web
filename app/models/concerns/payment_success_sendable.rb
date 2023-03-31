# frozen_string_literal: true

module PaymentSuccessSendable
  extend ActiveSupport::Concern

  def send_to_payment_email(subject:, recipients:, message:)
    PaymentMailer.with(invoice: self, subject:, recipients:, message:).payment.deliver_later
  end
end
