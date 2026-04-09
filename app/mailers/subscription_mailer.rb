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

  def plan_purchased
    @company = Company.find(params[:company_id])
    @alert_email = params[:alert_email].presence
    @plan_label = params[:plan_label].presence || @company.current_plan_label.to_s.humanize.titleize
    @display_plan_label = @plan_label == "Paid" ? "Miru Pro" : @plan_label
    @stripe_subscription_id = params[:stripe_subscription_id]
    @subscription_interval = params[:subscription_interval].presence || "month"
    @seat_quantity = params[:seat_quantity].presence || @company.billable_team_seats
    @billing_url = params[:billing_url].presence || "#{ENV['APP_BASE_URL']}/settings/billing"

    mail(
      to: @alert_email,
      subject: "Cha-ching! #{@company.name} bought #{@display_plan_label}",
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
