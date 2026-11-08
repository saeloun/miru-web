# frozen_string_literal: true

module PrivateMailDelivery
  extend ActiveSupport::Concern

  class_methods do
    def deliver_mail(mail)
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
end
