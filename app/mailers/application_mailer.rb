# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  append_view_path Rails.root.join("app", "views", "mailers")
  default from: ENV["DEFAULT_MAILER_SENDER"]
  layout "mailer"

  rescue_from Postmark::InactiveRecipientError do |exception|
    handle_inactive_recipient(exception)
  end

  rescue_from Postmark::InvalidEmailError do |exception|
    handle_invalid_email(exception)
  end

  private

    def handle_inactive_recipient(exception)
      # Extract email addresses from the error message
      inactive_emails = exception.message.scan(/[\w+\-.]+@[a-z\d-]+(\.[a-z\d-]+)*\.[a-z]+/i)

      Rails.logger.warn("Email delivery failed - Inactive recipient(s): #{inactive_emails.join(', ')}")
      Rails.logger.warn("Error details: #{exception.message}")

      # Store inactive emails in the database to prevent future attempts
      inactive_emails.each do |email|
        SesInvalidEmail.find_or_create_by(email: email.downcase) do |record|
          Rails.logger.info("Added #{email} to invalid emails list (Postmark inactive)")
        end
      end
    end

    def handle_invalid_email(exception)
      Rails.logger.warn("Email delivery failed - Invalid email format: #{exception.message}")

      # Extract and store invalid emails
      invalid_emails = exception.message.scan(/[\w+\-.]+@[a-z\d-]+(\.[a-z\d-]+)*\.[a-z]+/i)
      invalid_emails.each do |email|
        SesInvalidEmail.find_or_create_by(email: email.downcase) do |record|
          Rails.logger.info("Added #{email} to invalid emails list (Invalid format)")
        end
      end
    end
end
