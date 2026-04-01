# frozen_string_literal: true

class SendWeeklyReminderToUserMailer < ApplicationMailer
  def notify_user_about_missed_entries
    recipients = params[:recipients]
    @company = params[:company_name]
    @name = params[:name]

    @starting_date = params[:start_date].strftime("%B %-d")
    @ending_date = params[:end_date].strftime("%B %-d, %Y")

    subject = "Complete your Miru timesheet for last week"

    mail(to: recipients, subject:, reply_to: ENV["REPLY_TO_EMAIL"])
  end
end
