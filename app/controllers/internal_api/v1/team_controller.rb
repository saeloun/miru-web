# frozen_string_literal: true

class InternalApi::V1::TeamController < InternalApi::V1::ApplicationController
  helper ApplicationHelper

  def index
    authorize :index, policy_class: TeamPolicy
    team_index_details = Team::IndexService.new(
      current_company:,
      current_user:,
      query: params.dig(:q, :first_name_or_last_name_or_email_cont)
    ).process

    pagy_combined, combined_details = pagy_array(team_index_details[:combined_data], items: params[:items] || 10)

    render :index, locals: {
      combined_details:,
      pagination_details_combined: pagy_metadata(pagy_combined)
    }, status: :ok
  end

  def update
    authorize employment, policy_class: TeamPolicy
    user = Team::UpdateService.new(
      user_params:, current_company:, new_role: params[:role], user: employment.user).process
    render :update, locals: { user:, employment: }, status: :ok
  end

  def update_team_members
    authorize current_company, policy_class: CompanyPolicy

    current_company.update!(calendar_enabled: team_params[:calendar_enabled])
    current_company.employments.includes(:user).find_each do |item|
      item.user.update!(calendar_enabled: team_params[:calendar_enabled])
    end

    enabled_disabled = team_params[:calendar_enabled] ? "enabled" : "disabled"

    render json: {
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

    def team_params
      params.require(:team).permit(:calendar_enabled)
    end
end
