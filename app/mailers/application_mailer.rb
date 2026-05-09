# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  append_view_path Rails.root.join("app", "views", "mailers")
  SUPPORT_EMAIL = "support@getmiru.com"
  default(
    from: ENV["DEFAULT_MAILER_SENDER"].presence || "Miru <#{SUPPORT_EMAIL}>",
    reply_to: ENV["REPLY_TO_EMAIL"].presence || SUPPORT_EMAIL
  )
  layout "mailer"
  helper_method :miru_logo_dark_url, :miru_logo_light_url, :email_company_logo_url, :email_company_name

  MIRU_LOGO_FILES = {
    dark: ["MiruLogoDarkWithText.png", Rails.root.join("app", "assets", "images", "MiruLogoWithText.png")],
    light: ["MiruLogoLightWithText.png", Rails.root.join("app", "assets", "images", "MiruLogoLightWithText.png")]
  }.freeze

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
      MIRU_LOGO_FILES.each_value { |(filename, path)| attach_inline_logo(filename, path) }
    end

    def miru_logo_dark_url
      attach_miru_logos
      attachments[MIRU_LOGO_FILES[:dark].first]&.url
    end

    def miru_logo_light_url
      attach_miru_logos
      attachments[MIRU_LOGO_FILES[:light].first]&.url
    end

    def attach_inline_logo(filename, path)
      return if attachments[filename].present?

      return unless path.exist?

      attachments.inline[filename] = { content: path.binread, mime_type: "image/png" }
    end

    def email_company_logo_url
      company_details = @company_details&.with_indifferent_access
      company = email_company_record

      return logo_company_url(company) if company&.logo&.attached?
      return @company_logo if @company_logo.present?

      company_details[:logo] if company_details&.[](:logo).present?
    end

    def email_company_name
      company_details = @company_details&.with_indifferent_access
      company = email_company_record

      return company.name if company&.name.present?
      return @company if @company.is_a?(String) && @company.present?
      return company_details[:name] if company_details&.[](:name).present?

      t("mailers.layout.brand")
    end

    def email_company_record
      @company if @company.respond_to?(:logo) && @company.respond_to?(:name)
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
