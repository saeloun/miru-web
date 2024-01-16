# frozen_string_literal: true

class InternalApi::V1::InvitationsController < InternalApi::V1::ApplicationController
  before_action :set_invitation, only: [:update, :destroy, :resend]

  def create
    authorize :invitation
    Invitations::CreateInvitationService.new(invitation_params, current_company, current_user).process
    render json: { notice: I18n.t("invitation.create.success.message") }, status: :created
  end

  def update
    authorize @invitation

    @invitation.update!(invitation_params)
    render json: { notice: I18n.t("invitation.update.success.message") }, status: :ok
  end

  def destroy
    authorize @invitation

    @invitation.destroy!
    render json: { notice: I18n.t("invitation.delete.success.message") }, status: :ok
  end

  def resend
    authorize @invitation

    @invitation.resend_invitation
    render json: { notice: I18n.t("invitation.resent.success.message") }, status: :ok
  end

  private

    def invitation_params
      params.permit(policy(:invitation).permitted_attributes)
    end

    def set_invitation
      @invitation = Invitation.find(params[:id])
    end
end
