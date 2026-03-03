# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  append_view_path Rails.root.join("app", "views", "mailers")
  default from: ENV["DEFAULT_MAILER_SENDER"]
  layout "mailer"

  # Email regex based on URI::MailTo::EMAIL_REGEXP but without anchors for scanning
  EMAIL_SCAN_REGEXP = /[a-zA-Z0-9.!\#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/

  rescue_from Postmark::InactiveRecipientError do |exception|
    handle_inactive_recipient(exception)
  end

  private

    def handle_inactive_recipient(exception)
      # Extract email addresses from the error message
      inactive_emails = exception.message.scan(EMAIL_SCAN_REGEXP)

      Rails.logger.warn("Email delivery failed - Inactive recipient(s): #{inactive_emails.join(', ')}")
      Rails.logger.warn("Error details: #{exception.message}")

      # Store inactive emails in the database to prevent future attempts
      inactive_emails.each do |email|
        record = SesInvalidEmail.find_or_create_by(email: email.downcase)
        Rails.logger.info("Added #{email} to invalid emails list (Postmark inactive)") if record.previously_new_record?
      end
    end
end
