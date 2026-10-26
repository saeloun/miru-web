# frozen_string_literal: true

# rubocop:disable Rails/ApplicationMailer -- ApplicationMailer swallows Postmark delivery failures.
class HiringMailer < ActionMailer::Base
  # rubocop:enable Rails/ApplicationMailer
  default from: ApplicationMailer.default.fetch(:from)

  def acknowledgement(message_id)
    content = HiringMessage.find(message_id).content
    mail(to: content.fetch("to"), reply_to: content.fetch("reply_to"), subject: content.fetch("subject"),
      message_id: "hiring-#{message_id}@miru", body: content.fetch("body"), content_type: "text/plain; charset=UTF-8")
  end

  def self.deliver_mail(mail)
    error = nil
    # Default instrumentation includes the entire email and private provider errors.
    ActiveSupport::Notifications.instrument("deliver.action_mailer", mailer: name,
      message_id: mail.message_id, perform_deliveries: mail.perform_deliveries) do
      yield
    rescue StandardError => exception
      error = exception
    end
    raise error if error
  end
end
