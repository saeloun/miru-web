# frozen_string_literal: true

class SendWeeklyReminderToUserMailer < ApplicationMailer
  def notify_user_about_missed_entries
    recipients = params[:recipients]
    @company = params[:company_name]
    @name = params[:name]

    @starting_date = params[:start_date].to_date
    @ending_date = params[:end_date].to_date

    with_recipient_locale(recipient_user_from(recipients)) do
      mail(
        to: recipients,
        subject: I18n.t("mailers.send_weekly_reminder_to_user_mailer.notify_user_about_missed_entries.subject"),
        reply_to: ENV["REPLY_TO_EMAIL"]
      )
    end
  end
end
