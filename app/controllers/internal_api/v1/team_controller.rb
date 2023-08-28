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

    combined_data = team_data + invitation_data
    pagy_combined, combined_details = pagy_array(combined_data, items: params[:items] || 10)

    render :index, locals: {
      combined_details:,
      pagination_details_combined: pagy_metadata(pagy_combined)
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

  def update_team_members
    authorize current_company, policy_class: CompanyPolicy

    current_company.update!(calendar_enabled: params[:team][:calendar_enabled])
    current_company.employments.includes(:user).find_each do |item|
      item.user.update!(calendar_enabled: params[:team][:calendar_enabled])
    end

    enabled_disabled = params[:team][:calendar_enabled] ? "enabled" : "disabled"

    render json: {
             calendar_enabled: current_company.calendar_enabled,
             notice: "Calendar integration has been #{enabled_disabled} for all users of #{current_company.name}"
           },
      status: :ok
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
