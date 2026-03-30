# frozen_string_literal: true

require_relative "preview_support"

class SubscriptionMailerPreview < ActionMailer::Preview
  include PreviewSupport

  def trial_started
    company = sample_company
    company.update!(trial_ends_at: 30.days.from_now) if company.trial_ends_at.blank?

    SubscriptionMailer.with(company_id: company.id, recipient_id: sample_user.id).trial_started
  end

  def plan_purchased
    company = sample_company

    SubscriptionMailer.with(
      company_id: company.id,
      alert_email: sample_user.email,
      plan_label: "Miru Pro",
      stripe_subscription_id: "sub_preview_123",
      subscription_interval: "month",
      seat_quantity: company.billable_team_seats,
      billing_url: "https://app.miru.so/settings/billing"
    ).plan_purchased
  end
end
