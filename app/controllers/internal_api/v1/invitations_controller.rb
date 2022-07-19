# frozen_string_literal: true

class InternalApi::V1::InvitationsController < InternalApi::V1::ApplicationController
  before_action :set_invitation, only: [:update, :destroy]

  def create
    authorize :invitation
    @invitation = Invitation.new(invitation_params)
    @invitation.company = current_company
    @invitation.sender = current_user

    if @invitation.save!
      render json: { success: true, message: I18n.t(".success") }, status: :created
    end
  end

  def update
    authorize @invitation

    if @invitation.update!(invitation_params)
      render json: { success: true, message: I18n.t(".success") }
    end
  end

  def destroy
    authorize @invitation

    if @invitation.destroy!
      render json: { success: true, message: I18n.t(".success") }
    end
  end

  private

    def invitation_params
      params.permit(policy(:invitation).permitted_attributes)
    end

    def set_invitation
      @invitation = Invitation.find(params[:id])
    end
end
