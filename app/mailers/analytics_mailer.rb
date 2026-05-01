# frozen_string_literal: true

class AnalyticsMailer < ApplicationMailer
  def threshold_alert
    @company = Company.find(params[:company_id])
    @alert = params[:alert].deep_symbolize_keys
    @analytics_url = "#{ENV['APP_BASE_URL']}/reports"
    recipient = params[:recipient] || Array(params[:recipients]).first
    @recipient = recipient_user_from([recipient])

    with_recipient_locale(@recipient) do
      mail(
        to: recipient,
        subject: "#{@company.name}: #{@alert[:title]}",
        reply_to: default_reply_to_address
      )
    end
  end
end
