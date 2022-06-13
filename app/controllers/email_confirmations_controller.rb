# frozen_string_literal: true

class EmailConfirmationsController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized

  def show
    if user.confirmed?
      redirect_to root_path
    else
      render json: { user: }
    end
  end

  private

    def user
      @_user ||= User.kept.find_by_email(params[:email])
    end
end
