# frozen_string_literal: true

class MonthlyReportsDeliveryJob < ApplicationJob
  def perform(*)
    MonthlyReportsDeliveryService.new.process if ENV["ENABLE_MONTHLY_REPORT_DIGEST"].present?
  end
end
