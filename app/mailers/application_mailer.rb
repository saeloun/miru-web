# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  append_view_path Rails.root.join("app", "views", "mailers")
  default from: ENV["DEFAULT_MAILER_SENDER"] || "test@example.com"
  layout "mailer"
end
