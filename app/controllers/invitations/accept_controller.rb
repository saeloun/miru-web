# frozen_string_literal: true

class Invitations::AcceptController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized

  def index
    service = CreateInvitedUserService.new(params[:token] || params[:invitation_token], current_user)
    service.process

    if service.success
      flash[:success] = t(".success")
      if service.new_user
        return redirect_to edit_user_password_path(reset_password_token: service.reset_password_token)
      elsif current_user
        return redirect_to root_path
      end
    else
      flash[:error] = service.error_message
    end
    redirect_to "/invalid-link"
  end

  def show
    redirect_to root_path, notice: t(".success")
  end
end
