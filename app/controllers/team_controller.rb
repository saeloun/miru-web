# frozen_string_literal: true

class TeamController < ApplicationController
  # after_action :assign_role, only: [:update]
  before_action :set_user, only: %i[show update]

  def index
    @teams = current_company.users
  end

  def show
  end

  def update
    if @user.invitation_accepted?
      if @user.update(user_params)
        redirect_to team_index_path
      end
    else
      @user.skip_reconfirmation!
      if @user.email != (user_params[:email])
        if @user.update(user_params)
          @user.invite!
          redirect_to team_index_path
        end
      else
        if @user.update(user_params)
          redirect_to team_index_path
        end
      end
    end
  end

  def destroy
    @user = User.find(params[:id])
    @user.state = User.states[:inactive]
    @user.save!
    redirect_to "/team"
  end

  private
    def user_params
      params.require(:user).permit(:first_name, :last_name, :email, :confirmation_token)
    end

    # def user
    #   @_user ||= User.find(params[:id])
    # end
    # def assign_role
    #   @user.remove_role
    #   if @user.errors.empty?
    #     @user.add_role(params[:user][:roles].downcase.to_sym)
    #   end
    # end
    #
    def set_user
      @user = User.find(params[:id])
    end
end
