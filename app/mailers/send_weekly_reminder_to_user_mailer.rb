# frozen_string_literal: true

class SendWeeklyReminderToUserMailer < ApplicationMailer
  default reply_to: ENV["MAILER_REPLY_TO"] if ENV.fetch("MAILER_REPLY_TO", nil)

  def notify_user_about_missed_entries
    recipients = params[:recipients]
    @company = params[:company_name]
    @name = params[:name]

    @starting_date = params[:start_date]
    @starting_date = @starting_date.ordinalize(year: false)

    @ending_date = params[:end_date]
    @ending_date = @ending_date.ordinalize(year: false)

    subject = "Reminder to Update your Timesheet on Miru"

    mail(to: recipients, subject:)
  end
end
