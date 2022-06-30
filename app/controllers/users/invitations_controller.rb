# frozen_string_literal: true

class Users::InvitationsController < ApplicationController
  def create
    authorize current_user, policy_class: InvitationPolicy

    Invitation.create(invitation_params)
  end

  private

    def invitation_params
      params.require(:invitation).permit(policy(:invitation).permitted_attributes)
    end
end
