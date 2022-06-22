# frozen_string_literal: true

class WeeklyReminderToUserJob < ApplicationJob
  def perform(*args)
    if ENV["RAILS_LOG_TO_STDOUT"].present?
      WeeklyReminderForMissedEntriesService.new.process
    end
  end
end
