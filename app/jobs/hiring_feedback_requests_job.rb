# frozen_string_literal: true

class HiringFeedbackRequestsJob < ApplicationJob
  def perform = HiringFeedback.seed_missing
end
