# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  append_view_path Rails.root.join("app", "views", "mailers")
  SUPPORT_EMAIL = "support@getmiru.com"
  default(
    from: ENV["DEFAULT_MAILER_SENDER"].presence || "Miru <#{SUPPORT_EMAIL}>",
    reply_to: ENV["REPLY_TO_EMAIL"].presence || SUPPORT_EMAIL
  )
  layout "mailer"
  before_action :attach_miru_logo
  helper_method :miru_logo_attachment_url

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

    def attach_miru_logo
      return if attachments["miruLogoWithText.png"].present?

      logo_path = Rails.root.join("public", "miruLogoWithText.png")
      return unless logo_path.exist?

      attachments.inline["miruLogoWithText.png"] = {
        content: logo_path.binread,
        mime_type: "image/png"
      }
    end

    def miru_logo_attachment_url
      attachments["miruLogoWithText.png"]&.url
    end

    def default_reply_to_address
      ENV["REPLY_TO_EMAIL"].presence || self.class.default[:reply_to] || SUPPORT_EMAIL
    end

    def with_recipient_locale(user, &block)
      locale = user&.locale.presence || I18n.default_locale
      I18n.with_locale(locale, &block)
    end

    def recipient_user_from(recipients)
      User.find_by(email: Array(recipients).compact.first)
    end
end
