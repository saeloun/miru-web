# frozen_string_literal: true

class SendWeeklyReminderToUserMailer < ApplicationMailer
  def notify_user_about_missed_entries
    recipients = params[:recipients]
    @company = params[:company_name]
    @name = params[:name]

    @starting_date = params[:start_date]
    @starting_date = @starting_date.ordinalize(year: false)

    @ending_date = params[:end_date]
    @ending_date = @ending_date.ordinalize(year: false)

    subject = "Reminder to Update your Timesheet on Miru"

    mail(to: recipients, subject:, reply_to: ENV["REPLY_TO_EMAIL"])
  end
end
