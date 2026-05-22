# frozen_string_literal: true

class Analytics::ThresholdNotificationsJob < ApplicationJob
  queue_as :default

  NOTIFICATION_TTL = 1.week

  def perform(company_ids = nil)
    companies_scope(company_ids).find_each do |company|
      alerts = Analytics::ThresholdEvaluator.process(company: company)
      recipients = notification_recipients_for(company)

      next if alerts.blank? || recipients.blank?

      alerts.each do |alert|
        next unless claim_notification!(company.id, alert[:type])

        recipients.each do |recipient|
          AnalyticsMailer.with(
            company_id: company.id,
            recipient: recipient,
            alert: alert
          ).threshold_alert.deliver_later
        end
      end
    end
  end

  private

    def companies_scope(company_ids)
      company_ids.present? ? Company.where(id: Array(company_ids)) : Company.all
    end

    def notification_recipients_for(company)
      company.users.with_role([:owner, :admin, :book_keeper], company).distinct.filter_map do |user|
        preference = company.notification_preferences.find_by(user_id: user.id)
        user.email if preference&.can_receive_analytics_threshold_notifications?
      end.uniq
    end

    def claim_notification!(company_id, alert_type)
      AnalyticsThresholdNotificationLog
        .where(company_id: company_id, alert_type: alert_type)
        .where("notified_at <= ?", NOTIFICATION_TTL.ago)
        .delete_all

      AnalyticsThresholdNotificationLog.create!(
        company_id: company_id,
        alert_type: alert_type,
        notified_at: Time.current
      )
      true
    rescue ActiveRecord::RecordNotUnique, ActiveRecord::RecordInvalid
      false
    end
end
