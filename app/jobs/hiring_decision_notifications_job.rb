# frozen_string_literal: true

class HiringDecisionNotificationsJob < ApplicationJob
  def perform = Hiring::DecisionNotifications.queue_due
end
