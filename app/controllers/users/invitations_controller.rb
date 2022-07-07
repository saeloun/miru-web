# frozen_string_literal: true

class Users::InvitationsController < ApplicationController
  before_action :set_invitation, only: [:edit, :update, :destroy]
  skip_before_action :authenticate_user!, only: [:accept]
  skip_before_action :validate_company!, only: [:accept]
  skip_after_action :verify_authorized, only: [:accept]

  def create
    authorize :invitation
    @invitation = Invitation.new(invitation_params)
    @invitation.company = current_company
    @invitation.sender = current_user

    if @invitation.save
      flash[:success] = t(".success")
    else
      set_error_flash
    end

    redirect_to team_index_path
  end

  def edit
    authorize @invitation
  end

  def update
    authorize @invitation

    if @invitation.update(invitation_params)
      flash[:success] = t(".success")
    else
      set_error_flash
    end

    redirect_to team_index_path
  end

  def destroy
    authorize @invitation

    if @invitation.destroy
      flash[:success] = t(".success")
    else
      set_error_flash
    end

    redirect_to team_index_path
  end

  def accept
    service = CreateInvitedUserService.new(params[:token])
    service.process

    if service.success
      flash[:success] = t(".success")
      if service.new_user
        return redirect_to edit_user_password_path(reset_password_token: service.reset_password_token)
      elsif current_user
        return redirect_to root_path
      end
    else
      flash[:error] = service.error_message
    end

    redirect_to user_session_path
  end

  private

    def invitation_params
      params.require(:invitation).permit(policy(:invitation).permitted_attributes)
    end

    def set_invitation
      @invitation = Invitation.find(params[:id])
    end

    def set_error_flash
      flash[:error] = if @invitation.errors.empty?
        t(".failure")
      else
        @invitation.errors.full_messages.join(", ")
      end
    end
end
