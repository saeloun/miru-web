# frozen_string_literal: true

module ClientPaymentSendable
  extend ActiveSupport::Concern

  def send_to_client_email(invoice_id:, subject:, current_user_id:)
    ClientPaymentMailer.with(invoice_id:, subject:, current_user_id:).payment.deliver_later
  end
end
