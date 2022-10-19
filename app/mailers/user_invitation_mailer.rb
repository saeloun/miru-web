# frozen_string_literal: true

class UserInvitationMailer < ApplicationMailer
  default reply_to: ENV["MAILER_REPLY_TO"] if ENV.fetch("MAILER_REPLY_TO", nil)

  def send_user_invitation
    recipient = params[:recipient]
    @name = params[:name]
    @token = params[:token]
    @user_already_exists = params[:user_already_exists]
    subject = "Welcome to AC!"

    mail(to: recipient, subject:)
  end
end
