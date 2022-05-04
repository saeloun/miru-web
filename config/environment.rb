# frozen_string_literal: true

# Load the Rails application.
require_relative "application"

# Initialize the Rails application.
Rails.application.initialize!

# Sendgrid config
ActionMailer::Base.smtp_settings = {
  user_name: Rails.application.credentials.sendgrid[:sendgrid_username],
  password: Rails.application.credentials.sendgrid[:sendgrid_password],
  domain: ENV["SMTP_DOMAIN"],
  address: "smtp.sendgrid.net",
  port: ENV["SMTP_PORT"],
  authentication: :plain,
  enable_starttls_auto: true
}
