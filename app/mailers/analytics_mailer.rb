# frozen_string_literal: true

class AnalyticsMailer < ApplicationMailer
  def threshold_alert
    @company = Company.find(params[:company_id])
    @alert = params[:alert].deep_symbolize_keys
    @recipient = recipient_user_from(params[:recipients])

    with_recipient_locale(@recipient) do
      mail(
        to: params[:recipients],
        subject: "#{@company.name}: #{@alert[:title]}",
        reply_to: ENV["REPLY_TO_EMAIL"]
      )
    end
  end
end
