# frozen_string_literal: true

class TeamController < ApplicationController
  after_action :assign_role, only: [:update]

  def index
    query = current_company.users.ransack(params[:q])
    teams = query.result(distinct: true)
    render :index, locals: { query: query, teams: teams }
  end

  def edit
    @user = user
  end

  def update
    user.skip_reconfirmation! unless user.invitation_accepted?
    user_email = user.email
    user.update(user_params)
    user.invite! if user_email != (user_params[:email]) && !user.invitation_accepted?
    redirect_to team_index_path
  end

  def destroy
    user.discard
    redirect_to team_index_path
  end

  private
    def user_params
      params.require(:user).permit(:first_name, :last_name, :email)
    end

    def user
      @_user ||= User.kept.find(params[:id])
    end

    def assign_role
      user.remove_role(user.roles.first.name)
      if user.errors.empty?
        user.add_role(params[:user][:roles].downcase.to_sym)
      end
    end
end
