# frozen_string_literal: true

class Analytics::FounderDigestJob < ApplicationJob
  queue_as :default

  def perform
    recipients = founder_recipients

    if recipients.empty?
      Rails.logger.info("Analytics::FounderDigestJob skipped: no recipients")
      return
    end

    metrics = Analytics::GrowthMetricsService.process
    recipients.each do |recipient|
      FounderDigestMailer.with(recipient:, metrics:, date: Date.current).weekly.deliver_later
    end
  end

  private

    def founder_recipients
      configured = ENV["FOUNDER_DIGEST_EMAILS"]
      return configured.split(",").map(&:strip).compact_blank.uniq if configured.present?

      User.super_admins.pluck(:email)
    end
end
