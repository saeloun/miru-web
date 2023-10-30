# frozen_string_literal: true

class WeeklyReminderToUserJob < ApplicationJob
  def perform(*args)
    if ENV["ENABLE_WEEKLY_REMINDER"].present?
      WeeklyReminderForMissedEntriesService.new.process
    end
  end
end
