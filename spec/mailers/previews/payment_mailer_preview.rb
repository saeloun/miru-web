# frozen_string_literal: true

class PaymentMailerPreview < ActionMailer::Preview
  def payment
    invoice = Invoice.first || raise("No invoice found. Please create an invoice first.")
    user = User.first || raise("No user found. Please create a user first.")
    PaymentMailer.with(
      invoice_id: invoice.id,
      subject: "Payment details by #{invoice.client&.name || 'Unknown Client'}",
      current_user_id: user.id
    ).payment
  end
end
