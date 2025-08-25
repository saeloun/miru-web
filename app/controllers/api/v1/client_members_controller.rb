# frozen_string_literal: true

class Api::V1::ClientMembersController < Api::V1::ApplicationController
  def index
    authorize client, policy_class: ClientMemberPolicy

    render locals: {
      client_members: client.client_members.kept.includes(:user),
      invitations: client.invitations
    }, status: 200
  end

  def update
    authorize client, policy_class: ClientMemberPolicy

    Team::UpdateService.new(
      user_params:, current_company:, new_role: "client", user: employment.user).process

    render json: {
      notice: "Contact updated successfully"
    }, status: 200
  end

  def destroy
    authorize client, policy_class: ClientMemberPolicy

    if client_member.discard!
      employment.user.remove_roles_for(current_company)
      employment.discard!
      render json: {
        notice: "Contact deleted successfully"
      }, status: 200
    end
  end

  private

    def client
      @_client ||= current_company.clients.find(params[:client_id])
    end

    def client_member
      @_client_member ||= client.client_members.find(params[:id])
    end

    def user_params
      params.permit(policy(:client_member).permitted_attributes)
    end

    def employment
      @_employment ||= current_company.employments.includes(:user).kept.find_by!(user_id: client_member.user.id)
    end
end
