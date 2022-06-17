# frozen_string_literal: true

class WeeklyReminderToUserJob < ApplicationJob
  def perform(*args)
    WeeklyReminderForMissedEntriesService.new.process
  end
end
