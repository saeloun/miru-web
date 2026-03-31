# frozen_string_literal: true

require_relative "preview_support"

class PaymentMailerPreview < ActionMailer::Preview
  include PreviewSupport

  def payment
    invoice = sample_invoice
    invoice.update_columns(payment_sent_at: nil)
    PaymentMailer.with(
      invoice_id: invoice.id,
      subject: "Payment details by #{invoice.client.name}").payment
  end
end
