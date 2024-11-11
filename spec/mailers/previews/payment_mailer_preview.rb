# frozen_string_literal: true

class PaymentMailerPreview < ActionMailer::Preview
  def payment
    invoice = Invoice.first
    user = User.first
    PaymentMailer.with(
      invoice:,
      subject: "Payment details by #{invoice.client.name}",
      current_user_id: user.id
    ).payment
  end
end
