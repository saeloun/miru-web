# frozen_string_literal: true

module Invitations
  class CreateInvitationService
    attr_reader :params, :current_company, :current_user
    attr_accessor :invitation

    def initialize(params, current_company, current_user)
      @params = params
      @current_company = current_company
      @current_user = current_user
      @invitation = Invitation.new(params)
    end

    def process
      set_company
      set_sender
      invitation.save!
      sync_devise_invitable_metadata!
      invitation
    end

  private

    def set_company
      @invitation.company = current_company
    end

    def set_sender
      @invitation.sender = current_user
    end

    def sync_devise_invitable_metadata!
      current_user.increment!(:invitations_count)

      recipient = User.find_by(email: invitation.recipient_email)
      return unless recipient

      recipient.update_columns(
        invitation_token: invitation.token,
        invitation_created_at: invitation.created_at,
        invitation_sent_at: invitation.created_at,
        invited_by_type: current_user.class.name,
        invited_by_id: current_user.id
      )
    end
  end
end
