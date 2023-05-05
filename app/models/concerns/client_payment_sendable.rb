# frozen_string_literal: true

module ClientPaymentSendable
  extend ActiveSupport::Concern

  def send_to_client_email(invoice:, subject:)
    ClientPaymentMailer.with(invoice:, subject:).payment.deliver_later
  end
end
