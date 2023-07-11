# frozen_string_literal: true

class InternalApi::V1::TeamController < InternalApi::V1::ApplicationController
  helper ApplicationHelper

  def index
    authorize :index, policy_class: TeamPolicy
    # TODO: need to update either the search form or search logic in later PRs
    query = current_company.employments.kept.includes(user: [:roles, :avatar_attachment]).ransack(params[:q])
    invitations_query = current_company.invitations.valid_invitations
      .ransack(first_name_or_last_name_or_recipient_email_cont: params.dig(:q, :first_name_or_last_name_or_email_cont))
    teams = query.result(distinct: true)
    invitations = invitations_query.result(distinct: true)
    presenter_data = TeamPresenter.new(teams, invitations, current_user, current_company).index_data
    team_data = presenter_data[:teams]
    invitation_data = presenter_data[:invitations]
    pagy_details, team_details = pagy_array(team_data, items: params[:items] || 10)
    invitation_pagy_data, invitation_details = pagy_array(invitation_data, items: params[:items] || 5)
    render :index, locals: {
      teams: team_details,
      invitations: invitation_details,
      pagination_details: pagy_metadata(pagy_details)
    }, status: :ok
  end

  def update
    authorize employment, policy_class: TeamPolicy

    Team::UpdateService.new(
      user_params:, current_company:, new_role: params[:role], user: employment.user).process

    render json: {
      user: employment.user,
      notice: I18n.t("team.update.success.message")
    }, status: :ok
  end

  def destroy
    authorize employment, policy_class: TeamPolicy
    employment.user.remove_roles_for(current_company)
    employment.discard!

    render json: {
      user: employment.user,
      notice: I18n.t("team.delete.success.message")
    }, status: :ok
  end

  private

    def employment
      @_employment ||= current_company.employments.includes(:user).kept.find_by!(user_id: params[:id])
    end

    def user_params
      params.permit(policy(:team).permitted_attributes)
    end
end
