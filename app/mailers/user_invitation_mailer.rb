# frozen_string_literal: true

class UserInvitationMailer < ApplicationMailer
  def send_user_invitation
    recipient = params[:recipient]
    @token = params[:token]
    subject = "Welcome to Miru!"

    mail(to: recipient, subject:, reply_to: "no-reply@getmiru.com")
  end
end
