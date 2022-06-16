# frozen_string_literal: true

class InternalApi::V1::TeamController < InternalApi::V1::ApplicationController
  helper ApplicationHelper

  def index
    authorize :index, policy_class: TeamPolicy
    query = current_company.users.includes([:avatar_attachment, :roles]).ransack(params[:q])
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

  private

    def company_user
      @company_user ||= current_company.company_users.kept.find_by!(user_id: params[:id])
    end
end
