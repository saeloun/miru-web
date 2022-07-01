# frozen_string_literal: true

class Users::InvitationsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:accept]
  skip_after_action :verify_authorized, only: [:accept]

  def create
    authorize current_user, policy_class: InvitationPolicy
    invitation = Invitation.new(invitation_params)
    invitation.company = current_company
    invitation.sender = current_user

    if invitation.save
      flash[:success] = t(".success")
    else
      flash[:error] = t(".failure")
    end

    redirect_to team_index_path
  end

  def accept
    service = CreateInvitedUser.new(params[:token])
    service.process

    if service.success
      flash[:success] = t(".success")
      redirect_to edit_user_password_path(reset_password_token: service.reset_password_token)
    else
      flash[:error] = service.error_message
      redirect_to root_path
    end
  end

  private

    def invitation_params
      params.require(:invitation).permit(policy(:invitation).permitted_attributes)
    end
end
