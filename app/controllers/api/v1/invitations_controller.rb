# frozen_string_literal: true

class InternalApi::V1::InvitationsController < InternalApi::V1::ApplicationController
  before_action :set_invitation, only: [:update, :destroy, :resend]

  def create
    authorize :invitation
    invitation = Invitations::CreateInvitationService.new(invitation_params, current_company, current_user).process
    render :create, locals: {
                      invitation:
                    },
      status: 201
  end

  def update
    authorize @invitation

    @invitation.update!(invitation_params)
    render :update, locals: {
      invitation: @invitation
    }, status: 200
  end

  def destroy
    authorize @invitation

    invitation_id = @invitation.id
    @invitation.destroy!
    render json: { id: invitation_id, notice: I18n.t("invitation.delete.success.message") }, status: 200
  end

  def resend
    authorize @invitation

    @invitation.resend_invitation
    render json: { notice: I18n.t("invitation.resent.success.message") }, status: 200
  end

  private

    def invitation_params
      params.permit(policy(:invitation).permitted_attributes)
    end

    def set_invitation
      @invitation = Invitation.find(params[:id])
    end
end
