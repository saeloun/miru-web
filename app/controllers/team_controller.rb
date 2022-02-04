# frozen_string_literal: true

class TeamController < ApplicationController
  after_action :assign_role, only: [:update]

  def index
    @teams = current_company.users
  end

  def show
    @user = user
  end

  def update
    if user.invitation_accepted?
      if user.update(user_params)
        redirect_to team_index_path
      end
    else
      user.skip_reconfirmation!
      if user.email != (user_params[:email])
        if user.update(user_params)
          user.invite!
          redirect_to team_index_path
        end
      else
        if user.update(user_params)
          redirect_to team_index_path
        end
      end
    end
  end

  def destroy
    user = User.find(params[:id])
    user.discard
    redirect_to team_index_path
  end

  private
    def user_params
      params.require(:user).permit(:first_name, :last_name, :email, :confirmation_token)
    end

    def user
      @_user ||= User.find(params[:id])
    end

    def assign_role
      user.remove_role(user.roles.first.name)
      if user.errors.empty?
        user.add_role(params[:user][:roles].downcase.to_sym)
      end
    end
end
