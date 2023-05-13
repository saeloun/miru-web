# frozen_string_literal: true

class ClientPaymentMailerPreview < ActionMailer::Preview
  def payment
    invoice = Invoice.last
    ClientPaymentMailer.with(
      invoice:,
      subject: "Payment Receipt of Invoice #{invoice.invoice_number} from #{invoice.company.name}").payment
  end
end
