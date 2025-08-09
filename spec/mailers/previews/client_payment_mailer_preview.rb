# frozen_string_literal: true

class ClientPaymentMailerPreview < ActionMailer::Preview
  def payment
    invoice = Invoice.last || raise("No invoice found. Please create an invoice first.")
    user = User.first || raise("No user found. Please create a user first.")
    ClientPaymentMailer.with(
      invoice_id: invoice.id,
      subject: "Payment Receipt of Invoice #{invoice.invoice_number} from " \
               "#{invoice.company&.name || 'Unknown Company'}",
      current_user_id: user.id
    ).payment
  end
end
