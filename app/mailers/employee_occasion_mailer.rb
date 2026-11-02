# frozen_string_literal: true

class EmployeeOccasionMailer < ApplicationMailer
  self.raise_delivery_errors = true

  # Failed sends must propagate so the delivery log remains retryable.
  rescue_from Postmark::InactiveRecipientError do |exception|
    raise exception
  end

  def reminder(employment:, admin:, kind:, event_on:)
    @company = employment.company
    @employee_name = [employment.user.first_name, employment.user.last_name].join(" ")
    @occasion = kind == "birthday" ? "birthday" : "work anniversary"
    @event_date = event_on.strftime("%B %-d")
    @completed_years = event_on.year - employment.joined_at.year if kind == "work_anniversary"
    @profile_url = "#{ENV['APP_BASE_URL']}/team/#{employment.user_id}/employee-records?company_id=#{@company.id}"
    mail(to: admin.email, subject: "Upcoming #{@occasion}: #{@employee_name}")
  end
end
