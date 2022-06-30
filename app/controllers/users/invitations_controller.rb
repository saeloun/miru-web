# frozen_string_literal: true

class Users::InvitationsController < ApplicationController
  def create
    authorize current_user, policy_class: InvitationPolicy
    @invitation = Invitation.new(invitation_params)
    @invitation.company = current_company
    @invitation.sender = current_user

    if @invitation.save
      flash[:success] = t(".success")
    else
      flash[:error] = t(".failure")
    end

    redirect_to team_index_path
  end

  private

    def invitation_params
      params.require(:invitation).permit(policy(:invitation).permitted_attributes)
    end
end
