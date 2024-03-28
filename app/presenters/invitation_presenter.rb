# frozen_string_literal: true

class InvitationPresenter
  attr_reader :invitation

  def initialize(invitation)
    @invitation = invitation
  end

  def process
    {
      id: invitation.id,
      name: invitation.full_name,
      firstName: invitation.first_name,
      lastName: invitation.last_name,
      email: invitation.recipient_email,
      role: invitation.role,
      status: "INVITATION PENDING",
      isTeamMember: false,
      profilePicture: ActionController::Base.helpers.image_url("avatar.svg")
    }
  end
end
