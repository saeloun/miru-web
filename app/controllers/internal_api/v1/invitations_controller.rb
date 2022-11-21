# frozen_string_literal: true

class InternalApi::V1::InvitationsController < InternalApi::V1::ApplicationController
  before_action :set_invitation, only: [:update, :destroy]

  def create
    authorize :invitation
    @invitation = Invitation.new(invitation_params)
    @invitation.company = current_company
    @invitation.sender = current_user

    @invitation.save!
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

  private
    def invitation_params
      params.permit(policy(:invitation).permitted_attributes)
    end

    def set_invitation
      @invitation = Invitation.find(params[:id])
    end
end
