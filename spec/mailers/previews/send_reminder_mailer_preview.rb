# frozen_string_literal: true

require_relative "preview_support"

# Preview all emails at http://localhost:3000/rails/mailers/send_reminder_mailer/send_reminder

class SendReminderMailerPreview < ActionMailer::Preview
  include PreviewSupport

  def send_reminder
    invoice = sample_invoice
    SendReminderMailer.with(
      invoice:,
      recipients: [invoice.client.email],
      message: "A quick reminder that this invoice is still awaiting payment.",
      subject: "Reminder for overdue payments"
    ).send_reminder
  end
end
