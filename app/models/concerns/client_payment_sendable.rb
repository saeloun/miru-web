# frozen_string_literal: true

module ClientPaymentSendable
  extend ActiveSupport::Concern

  def send_to_client_email(invoice_id:, subject:)
    ClientPaymentMailer.with(invoice_id:, subject:).payment.deliver_later
  end
end
