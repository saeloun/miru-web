# frozen_string_literal: true

class FounderDigestMailer < ApplicationMailer
  def weekly
    @metrics = params[:metrics].deep_symbolize_keys
    @digest_date = params[:date].presence&.to_date || Date.current

    mail(
      to: params[:recipient],
      subject: "Miru growth digest — #{@digest_date.to_fs(:long)}",
      reply_to: default_reply_to_address
    )
  end
end
