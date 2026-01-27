# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  append_view_path Rails.root.join("app", "views", "mailers")
  default from: ENV["DEFAULT_MAILER_SENDER"]
  layout "mailer"

  rescue_from Postmark::InactiveRecipientError do |exception|
    handle_inactive_recipient(exception)
  end

  private

    def handle_inactive_recipient(exception)
      # Extract email addresses from the error message
      # Use non-capturing group (?:...) to get full email addresses
      inactive_emails = exception.message.scan(/[\w+\-.]+@[a-z\d-]+(?:\.[a-z\d-]+)*\.[a-z]+/i)

      Rails.logger.warn("Email delivery failed - Inactive recipient(s): #{inactive_emails.join(', ')}")
      Rails.logger.warn("Error details: #{exception.message}")

      # Store inactive emails in the database to prevent future attempts
      inactive_emails.each do |email|
        email_downcase = email.downcase
        record = SesInvalidEmail.find_or_create_by(email: email_downcase)
        Rails.logger.info("Added #{email} to invalid emails list (Postmark inactive)") if record.previously_new_record?
      end
    end
end
