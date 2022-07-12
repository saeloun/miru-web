# frozen_string_literal: true

class InvitationsController < ApplicationController
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
      redirect_to team_index_path, notice: t(".success")
    else
      redirect_to team_index_path, alert: set_error_flash
    end
  end

  def edit
    authorize @invitation
  end

  def update
    authorize @invitation

    if @invitation.update(invitation_params)
      redirect_to team_index_path, notice: t(".success")
    else
      redirect_to team_index_path, alert: set_error_flash
    end
  end

  def destroy
    authorize @invitation

    if @invitation.destroy
      redirect_to team_index_path, notice: t(".success")
    else
      redirect_to team_index_path, alert: set_error_flash
    end
  end

  private

    def invitation_params
      params.require(:invitation).permit(policy(:invitation).permitted_attributes)
    end

    def set_invitation
      @invitation = Invitation.find(params[:id])
    end

    def set_error_flash
      if @invitation.errors.empty?
        t(".failure")
      else
        @invitation.errors.full_messages.join(", ")
      end
    end
end
