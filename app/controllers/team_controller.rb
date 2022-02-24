# frozen_string_literal: true

class TeamController < ApplicationController
  skip_after_action :verify_authorized, only: :index
  after_action :assign_role, only: [:update]

  def index
    query = current_company.users.ransack(params[:q])
    teams = query.result(distinct: true)
    render :index, locals: { query: query, teams: teams }
  end

  def edit
    authorize user, policy_class: TeamPolicy
    @user = user
  end

  def update
    authorize user, policy_class: TeamPolicy
    user.skip_reconfirmation! unless user.invitation_accepted?
    user_email = user.email
    user.update(user_params)
    user.invite! if user_email != (user_params[:email]) && !user.invitation_accepted?
    redirect_to team_index_path
  end

  def destroy
    authorize user, policy_class: TeamPolicy
    user.discard
    redirect_to team_index_path
  end

  private
    def user_params
      params.require(:user).permit(policy(:team).permitted_attributes)
    end

    def user
      @_user ||= User.kept.find(params[:id])
    end

    def assign_role
      user.remove_role(user.roles.first.name) if user.roles.present?
      if user.errors.empty? && current_company.present?
        user.add_role(params[:user][:roles].downcase.to_sym, current_company)
      end
    end
end
