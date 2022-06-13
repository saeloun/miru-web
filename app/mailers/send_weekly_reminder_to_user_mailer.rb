# frozen_string_literal: true

class SendWeeklyReminderToUserMailer < ApplicationMailer
  def notify_user_about_missed_entries
    recipients = params[:recipients]
    @name = params[:name]
    @starting_date = params[:start_date]
    @ending_date = params[:end_date]
    subject = "Missed time entries report for the week ending on #{@ending_date}"

    mail(to: recipients, subject:, reply_to: "no-reply@miru.com")
  end
end
