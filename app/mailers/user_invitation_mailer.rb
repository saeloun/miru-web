# frozen_string_literal: true

class UserInvitationMailer < ApplicationMailer
  def send_user_invitation
    recipient = params[:recipient]
    @name = params[:name]
    @token = params[:token]
    @user_already_exists = params[:user_already_exists]
    subject = "Welcome to Miru!"

    mail(to: recipient, subject:, reply_to: "no-reply@getmiru.com")
  end
end
