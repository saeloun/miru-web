# frozen_string_literal: true

class HiringFeedbackRequestsJob < ApplicationJob
  def perform
    HiringFeedback.seed_missing
    Hiring::FeedbackNotifications.queue_due
  end
end
