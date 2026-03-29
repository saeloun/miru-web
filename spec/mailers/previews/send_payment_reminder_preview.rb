# frozen_string_literal: true

require_relative "preview_support"

# Preview all emails at http://localhost:3000/rails/mailers/send_payment_reminder

class SendPaymentReminderPreview < ActionMailer::Preview
  include PreviewSupport

  def send_payment_reminder
    client = sample_client
    invoice_ids = client.invoices.order(updated_at: :desc).limit(3).pluck(:id)
    invoice_ids = [sample_invoice.id] if invoice_ids.empty?

    SendPaymentReminderMailer.with(
      recipients: [client.email],
      selected_invoices: invoice_ids,
      message: "This is a gentle reminder to complete payments for the following invoices. "\
                "You can find the respective payment links along with the invoice details given below",
      subject: "Reminder to complete payments for unpaid invoices",
    ).send_payment_reminder
  end
end
