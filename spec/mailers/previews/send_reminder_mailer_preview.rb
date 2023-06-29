# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/send_reminder_mailer/send_reminder

class SendReminderMailerPreview < ActionMailer::Preview
  def send_reminder
    invoice = Invoice.last
    SendReminderMailer.with(
      invoice:,
      subject: "Reminder for overdue payments"
    ).send_reminder
  end
end
