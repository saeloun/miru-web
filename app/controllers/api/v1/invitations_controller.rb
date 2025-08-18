# frozen_string_literal: true

class Api::V1::InvitationsController < Api::V1::BaseController
  before_action :set_invitation, only: [:show, :update, :destroy, :resend]
  after_action :verify_authorized, except: [:index]

  def index
    invitations = current_company.invitations.includes(:sender, :recipient).order(created_at: :desc)
    render json: { invitations: invitations.map { |i| serialize_invitation(i) } }, status: 200
  end

  def show
    authorize @invitation
    render json: { invitation: serialize_invitation(@invitation) }, status: 200
  end

  def create
    @invitation = current_company.invitations.build(invitation_params)
    @invitation.sender = current_user
    authorize @invitation

    if @invitation.save
      InvitationMailer.invitation_email(@invitation).deliver_later
      render json: { invitation: serialize_invitation(@invitation), notice: "Invitation sent successfully" }, status: 201
    else
      render json: { errors: @invitation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @invitation

    if @invitation.update(invitation_params)
      render json: { invitation: serialize_invitation(@invitation), notice: "Invitation updated successfully" }, status: 200
    else
      render json: { errors: @invitation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @invitation

    if @invitation.destroy
      render json: { notice: "Invitation deleted successfully" }, status: 200
    else
      render json: { errors: ["Failed to delete invitation"] }, status: :unprocessable_entity
    end
  end

  def resend
    authorize @invitation
    InvitationMailer.invitation_email(@invitation).deliver_later
    render json: { notice: "Invitation resent successfully" }, status: 200
  end

  private

    def set_invitation
      @invitation = current_company.invitations.find(params[:id])
    end

    def invitation_params
      params.require(:invitation).permit(:recipient_email, :role, :first_name, :last_name)
    end

    def serialize_invitation(invitation)
      {
        id: invitation.id,
        recipient_email: invitation.recipient_email,
        role: invitation.role,
        status: invitation.status,
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        sender_name: invitation.sender&.full_name,
        sent_at: invitation.created_at,
        accepted_at: invitation.accepted_at
      }
    end
end
