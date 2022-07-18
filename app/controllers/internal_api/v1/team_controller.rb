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

    render :index, locals: { teams:, invitations: }, status: :ok
  end

  def destroy
    authorize :team
    employment.discard!
    render json: {
      user: employment.user,
      notice: I18n.t("team.delete.success.message")
    }, status: :ok
  end

  def update
    authorize :team
    update_company_user_role
    render json: {
      user: company_user.user,
      notice: I18n.t("team.update.success.message")
    }, status: :ok
  end

  private

    def employment
      @employment ||= current_company.employments.kept.find_by!(user_id: params[:id])
    end

    def update_company_user_role
      current_role = current_company_role(company_user.user)

      company_user.user.remove_role(current_role.name.to_sym, current_company) if current_role.present?
      company_user.user.add_role(params[:role].downcase.to_sym, current_company)
    end

    def current_company_role(user)
      user.roles.find_by(resource: current_company)
    end
end
