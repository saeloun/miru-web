# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/send_weekly_reminder_to_user_mailer
class SendWeeklyReminderToUserMailerPreview < ActionMailer::Preview
  def notify_user_about_missed_entries
    user = User.first
    company_name = user.companies.first.name
    start_date = 1.week.ago.beginning_of_week
    end_date = 1.week.ago.end_of_week
    recipients = [user.email, "miru@example.com"]

    SendWeeklyReminderToUserMailer.with(
      recipients:, name: user.full_name, start_date:, end_date:,
      company_name:).notify_user_about_missed_entries
  end
end
