# frozen_string_literal: true

# rubocop:disable Rails/ApplicationMailer -- ApplicationMailer swallows Postmark delivery failures.
class HiringMailer < ActionMailer::Base
  # rubocop:enable Rails/ApplicationMailer
  default from: ApplicationMailer.default.fetch(:from)
  include PrivateMailDelivery

  def acknowledgement(message_id)
    content = HiringMessage.find(message_id).content
    mail(to: content.fetch("to"), reply_to: content.fetch("reply_to"), subject: content.fetch("subject"),
      message_id: "hiring-#{message_id}@miru", body: content.fetch("body"), content_type: "text/plain; charset=UTF-8")
  end
end
