# frozen_string_literal: true

# Load the Rails application.
require_relative "application"

# Initialize the Rails application.
Rails.application.initialize!

# Sendgrid config
ActionMailer::Base.smtp_settings = {
  user_name: ENV["SENDGRID_USERNAME"],
  password: ENV["SENDGRID_PASSWORD"],
  domain: ENV["SMTP_DOMAIN"],
  address: "smtp.sendgrid.net",
  port: ENV["SMTP_PORT"],
  authentication: :plain,
  enable_starttls_auto: true
}
