# frozen_string_literal: true

class PaymentMailerPreview < ActionMailer::Preview
  def payment
    invoice = Invoice.first
    PaymentMailer.with(
      invoice:,
      subject: "Payment details by #{invoice.client.name}").payment
  end
end
