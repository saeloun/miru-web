# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  append_view_path Rails.root.join("app", "views", "mailers")
  SUPPORT_EMAIL = "support@getmiru.com"
  default(
    from: ENV["DEFAULT_MAILER_SENDER"].presence || "Miru <#{SUPPORT_EMAIL}>",
    reply_to: ENV["REPLY_TO_EMAIL"].presence || SUPPORT_EMAIL
  )
  layout "mailer"
  before_action :attach_miru_logos
  helper_method :miru_logo_dark_url, :miru_logo_light_url, :email_company_logo_url, :email_company_name

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

    def attach_miru_logos
      attach_inline_logo("MiruLogoDarkWithText.png")
      attach_inline_logo("MiruLogoLightWithText.png")
    end

    def miru_logo_dark_url
      attachments["MiruLogoDarkWithText.png"]&.url
    end

    def miru_logo_light_url
      attachments["MiruLogoLightWithText.png"]&.url
    end

    def attach_inline_logo(filename)
      return if attachments[filename].present?

      path = Rails.root.join("public", filename)
      return unless path.exist?

      attachments.inline[filename] = { content: path.binread, mime_type: "image/png" }
    end

    def email_company_logo_url
      return @company_logo if @company_logo.present?
      return @company_details[:logo] if @company_details&.[](:logo).present?
      logo_company_url(@company) if @company&.logo&.attached?
    end

    def email_company_name
      return @company&.name if @company&.name.present?
      return @company_details&.[](:name) if @company_details&.[](:name).present?
      t("mailers.layout.brand")
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
