# frozen_string_literal: true

class SendWeeklyReminderToUserMailer < ApplicationMailer
  def notify_user_about_missed_entries
    recipients = params[:recipients]
    @company = params[:company_name]
    @name = params[:name]
    @starting_date = params[:start_date].strftime("%d-%b-%Y")
    @ending_date = params[:end_date].strftime("%d-%b-%Y")
    subject = "Reminder to Update your Timesheet in Miru"

    mail(to: recipients, subject:, reply_to: "no-reply@miru.com")
  end
end
