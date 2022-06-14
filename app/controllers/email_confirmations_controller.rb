# frozen_string_literal: true

class EmailConfirmationsController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  before_action :verify_confirmed_user

  def show
    resend_url = resend_email_confirmation_path({ email: user.email })
    render :show, locals: { user:, resend_url: }
  end

  def resend
    user.send_confirmation_instructions
    flash[:notice] = t("confirmation.send_instructions", email: user.email)
    redirect_to new_user_session_path
  end

  private

    def verify_confirmed_user
      if user.confirmed?
        redirect_to root_path
      end
    end

    def user
      @_user ||= User.kept.find_by_email!(params[:email])
    end
end
