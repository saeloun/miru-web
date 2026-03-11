# frozen_string_literal: true

class SubscriptionMailer < ApplicationMailer
  def trial_started
    @company = Company.find(params[:company_id])
    @recipient = User.find(params[:recipient_id])
    @trial_ends_at = @company.trial_ends_at
    @billing_url = "#{ENV['APP_BASE_URL']}/settings/billing"

    mail(
      to: @recipient.email,
      subject: "Your Miru Pro trial is active",
      reply_to: ENV["REPLY_TO_EMAIL"]
    )
  end
end
