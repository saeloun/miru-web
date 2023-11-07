# frozen_string_literal: true

class InternalApi::V1::TeamController < InternalApi::V1::ApplicationController
  helper ApplicationHelper

  def index
    authorize :index, policy_class: TeamPolicy
    user_ids = current_company.employments.kept.pluck(:user_id)
    invitation_ids = current_company.invitations.valid_invitations.pluck(:id)
    teams = User.search(
      params.dig(:q, :first_name_or_last_name_or_email_cont) || "*",
      fields: [:first_name, :last_name, :email],
      match: :word_middle,
      where: { id: user_ids }
    )
    invitations = Invitation.search(
      params.dig(:q, :first_name_or_last_name_or_email_cont) || "*",
      fields: [:first_name, :last_name, :recipient_email],
      match: :word_middle,
      where: { sender_id: current_user.id }
    )

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
