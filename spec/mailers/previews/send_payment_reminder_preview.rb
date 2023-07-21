# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/send_payment_reminder

class SendPaymentReminderPreview < ActionMailer::Preview
  def send_payment_reminder
    client = Client.last

    SendPaymentReminderMailer.with(
      recipients: [client.email],
      selected_invoices: [client.invoice_ids],
      message: "This is a gentle reminder to complete payments for the following invoices. "\
                "You can find the respective payment links along with the invoice details given below",
      subject: "Reminder to complete payments for unpaid invoices",
    ).send_payment_reminder
  end
end
