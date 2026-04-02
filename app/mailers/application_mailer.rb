# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  append_view_path Rails.root.join("app", "views", "mailers")
  default from: ENV["DEFAULT_MAILER_SENDER"] || "test@example.com"
  layout "mailer"

  rescue_from Postmark::InactiveRecipientError do |exception|
    self.class.handle_inactive_recipient(exception)
  end

  class << self
    def handle_inactive_recipient(exception)
      inactive_emails = extract_inactive_emails(exception.message)

      Rails.logger.warn("Email delivery failed - Inactive recipient(s): #{inactive_emails.join(', ')}")
      Rails.logger.warn("Error details: #{exception.message}")
    end

    private

      def extract_inactive_emails(message)
        message
          .split(/[\s,]+/)
          .map { |value| value.gsub(/\A[^[:alnum:]]+|[^[:alnum:]]+\z/, "") }
          .select { |value| URI::MailTo::EMAIL_REGEXP.match?(value) }
          .uniq
      end
  end

  private

    def handle_inactive_recipient(exception)
      self.class.handle_inactive_recipient(exception)
    end

    def extract_inactive_emails(message)
      self.class.send(:extract_inactive_emails, message)
    end

    def with_recipient_locale(user, &block)
      locale = user&.locale.presence || I18n.default_locale
      I18n.with_locale(locale, &block)
    end

    def recipient_user_from(recipients)
      User.find_by(email: Array(recipients).compact.first)
    end
end
