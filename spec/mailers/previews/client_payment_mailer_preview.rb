# frozen_string_literal: true

class ClientPaymentMailerPreview < ActionMailer::Preview
  def payment
    invoice = Invoice.last
    ClientPaymentMailer.with(
      invoice_id: invoice.id,
      subject: "Payment Receipt of Invoice #{invoice.invoice_number} from #{invoice.company.name}",
      current_user_id: User.first.id
    ).payment
  end
end
