# frozen_string_literal: true

class HiringRetentionJob < ApplicationJob
  def perform
    result = Hiring::Retention.sweep
    Rails.logger.info("Hiring retention completed: deleted=#{result[:deleted]} skipped=#{result[:skipped]}")
    result
  end
end
