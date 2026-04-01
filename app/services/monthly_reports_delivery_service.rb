# frozen_string_literal: true

class MonthlyReportsDeliveryService
  def initialize(month: Date.current.prev_month)
    @month = month.to_date.beginning_of_month
  end

  def process
    eligible_preferences.find_each do |preference|
      next unless preference.can_receive_monthly_report_digest?

      MonthlyReportsMailer.with(
        company_id: preference.company_id,
        recipient_id: preference.user_id,
        month: month.iso8601
      ).cash_flow_digest.deliver_later
    end
  end

  private

    attr_reader :month

    def eligible_preferences
      NotificationPreference
        .where(monthly_report_digest_enabled: true)
        .where(unsubscribed_from_all: false)
        .joins(:user)
        .where(users: { discarded_at: nil })
    end
end
