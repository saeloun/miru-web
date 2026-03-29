# frozen_string_literal: true

require_relative "preview_support"

class ClientPaymentMailerPreview < ActionMailer::Preview
  include PreviewSupport

  def payment
    invoice = sample_invoice
    ClientPaymentMailer.with(
      invoice_id: invoice.id,
      subject: "Payment Receipt of Invoice #{invoice.invoice_number} from #{invoice.company.name}").payment
  end
end
