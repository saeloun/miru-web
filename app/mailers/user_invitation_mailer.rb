# frozen_string_literal: true

class UserInvitationMailer < ApplicationMailer
  def send_user_invitation
    recipient = params[:recipient]
    @name = params[:name]
    @token = params[:token]
    @company_details = params[:company_details]
    @sender_details = params[:sender_details]
    @user_already_exists = params[:user_already_exists]

    with_recipient_locale(User.find_by(email: recipient)) do
      subject = I18n.t("mailers.user_invitation_mailer.send_user_invitation.subject")
      mail(to: recipient, subject:, reply_to: ENV["REPLY_TO_EMAIL"])
    end
  end
end
