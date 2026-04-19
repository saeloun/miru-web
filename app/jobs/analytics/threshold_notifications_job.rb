# frozen_string_literal: true

class Analytics::ThresholdNotificationsJob < ApplicationJob
  queue_as :default

  NOTIFICATION_TTL = 12.hours
  FALLBACK_CACHE = ActiveSupport::Cache::MemoryStore.new

  def perform(company_ids = nil)
    companies_scope(company_ids).find_each do |company|
      alerts = Analytics::ThresholdEvaluator.process(company: company)
      recipients = notification_recipients_for(company)

      next if alerts.blank? || recipients.blank?

      alerts.each do |alert|
        next if recently_notified?(company.id, alert[:type])

        AnalyticsMailer.with(
          company_id: company.id,
          recipients: recipients,
          alert: alert
        ).threshold_alert.deliver_later

        mark_notified(company.id, alert[:type])
      end
    end
  end

  private

    def companies_scope(company_ids)
      company_ids.present? ? Company.where(id: Array(company_ids)) : Company.all
    end

    def notification_recipients_for(company)
      company.users.with_role([:owner, :admin, :book_keeper], company).distinct.select do |user|
        preference = company.notification_preferences.find_by(user_id: user.id)
        preference.nil? || preference.can_receive_emails?
      end.map(&:email).uniq
    end

    def recently_notified?(company_id, alert_type)
      cache_store.read(cache_key(company_id, alert_type)).present?
    end

    def mark_notified(company_id, alert_type)
      cache_store.write(cache_key(company_id, alert_type), Time.current.iso8601, expires_in: NOTIFICATION_TTL)
    end

    def cache_key(company_id, alert_type)
      "analytics:threshold_notification:#{company_id}:#{alert_type}"
    end

    def cache_store
      Rails.cache.is_a?(ActiveSupport::Cache::NullStore) ? FALLBACK_CACHE : Rails.cache
    end
end
