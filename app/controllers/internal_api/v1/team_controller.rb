# frozen_string_literal: true

class InternalApi::V1::TeamController < InternalApi::V1::ApplicationController
  helper ApplicationHelper

  def index
    authorize :index, policy_class: TeamPolicy
    query = current_company.company_users.kept.includes(user: [:roles, :avatar_attachment]).ransack(params[:q])
    team = query.result(distinct: true)
    render :index, locals: { team: }, status: :ok
  end

  def destroy
    authorize :team
    company_user.discard!
    render json: {
      user: company_user.user,
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

    def company_user
      @company_user ||= current_company.company_users.kept.find_by!(user_id: params[:id])
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
