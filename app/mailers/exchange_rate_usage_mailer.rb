# frozen_string_literal: true

class ExchangeRateUsageMailer < ApplicationMailer
  def usage_warning(user, usage)
    @user = user
    @usage = usage
    @percentage = usage.usage_percentage
    @remaining = usage.remaining_requests

    mail(
      to: user.email,
      subject: "Exchange Rate API Usage Warning - #{@percentage}% Used"
    )
  end
end
