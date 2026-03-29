# frozen_string_literal: true

require_relative "preview_support"

# Preview all emails at http://localhost:3000/rails/mailers/user_invitation
class UserInvitationPreview < ActionMailer::Preview
  include PreviewSupport

  def send_user_invitation
    UserInvitationMailer.with(sample_invitation_payload).send_user_invitation
  end
end
