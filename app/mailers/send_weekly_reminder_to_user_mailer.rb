# frozen_string_literal: true

class SendWeeklyReminderToUserMailer < ApplicationMailer
  def notify_user_about_missed_entries
    recipients = params[:recipients]
    @company = params[:company_name]
    @name = params[:name]
    
    @starting_date = params[:start_date]
    @starting_date.strftime("%B #{@starting_date.day.ordinalize}")

    @ending_date = params[:end_date]
    @ending_date.strftime("%B #{@ending_date.day.ordinalize}")

    subject = "Reminder to Update your Timesheet on Miru"

    mail(to: recipients, subject:, reply_to: "no-reply@getmiru.com")
  end
end
