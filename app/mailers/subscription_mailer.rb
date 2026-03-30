# frozen_string_literal: true

class SubscriptionMailer < ApplicationMailer
  def trial_started
    @company = Company.find(params[:company_id])
    @recipient = User.find(params[:recipient_id])
    @trial_ends_at = @company.trial_ends_at
    @trial_end_date_text = @trial_ends_at&.in_time_zone(resolved_time_zone)&.strftime("%B %-d, %Y")
    @billing_url = "#{ENV['APP_BASE_URL']}/settings/billing"

    mail(
      to: @recipient.email,
      subject: "Your Miru Pro trial is active",
      reply_to: ENV["REPLY_TO_EMAIL"]
    )
  end

  private

    def resolved_time_zone
      raw_zone = @company.timezone.presence
      return Time.zone if raw_zone.blank?

      ActiveSupport::TimeZone[raw_zone] ||
        ActiveSupport::TimeZone[raw_zone.sub(/\A\(GMT[^)]*\)\s*/, "")] ||
        Time.zone
    end
end
