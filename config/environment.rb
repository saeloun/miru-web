# frozen_string_literal: true

# Load the Rails application.
require_relative "application"

# Initialize the Rails application.
Rails.application.initialize!

# Sendgrid config
ActionMailer::Base.smtp_settings = {
  address: ENV["SMPT_ADDRESS"],
  port: ENV["SMTP_PORT"],
  authentication: :login,
  user_name: ENV["SMTP_USERNAME"],
  password: ENV["SMTP_PASSWORD"],
  enable_starttls_auto: true
}
