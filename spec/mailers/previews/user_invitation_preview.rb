# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/user_invitation
class UserInvitationPreview < ActionMailer::Preview
  def send_user_invitation
    invitation = Invitation.last

    UserInvitationMailer.with(
      recipient: invitation.recipient_email,
      token: invitation.token,
      user_already_exists: false,
      name: invitation.full_name
    ).send_user_invitation
  end
end
