# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  prepend_view_path "app/views/mailers"
  default from: ENV["MAILER_SENDER"]
  layout "mailer"
end
