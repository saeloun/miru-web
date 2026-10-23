# frozen_string_literal: true

class EmployeeOccasionRemindersJob < ApplicationJob
  queue_as :default

  def perform
    EmployeeRecordSetting.where(occasion_reminders_enabled: true).includes(:company).find_each do |setting|
      next unless Payroll::Entitlement.enabled?(setting.company_id)

      EmployeeOccasions::ReminderService.new(company: setting.company).process
    end
  end
end
