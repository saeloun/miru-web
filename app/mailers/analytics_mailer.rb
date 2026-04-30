# frozen_string_literal: true

class AnalyticsMailer < ApplicationMailer
  def threshold_alert
    @company = Company.find(params[:company_id])
    @alert = params[:alert].deep_symbolize_keys
    recipient = params[:recipient] || Array(params[:recipients]).first
    @recipient = recipient_user_from([recipient])

    with_recipient_locale(@recipient) do
      mail(
        to: recipient,
        subject: "#{@company.name}: #{@alert[:title]}",
        reply_to: ENV["REPLY_TO_EMAIL"]
      )
    end
  end
end
