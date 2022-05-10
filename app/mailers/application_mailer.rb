# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: ENV["MAILER_SENDER"]
  layout "mailer"
end
