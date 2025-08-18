# frozen_string_literal: true

class HomeController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index]
  skip_after_action :verify_authorized
  before_action :set_google_oauth_success

  def index
    # Allow all users including super_admins to use the main app
    # They can access admin panel via /admin if needed
    respond_to do |format|
      format.html { render }
      format.json { render json: { status: "ok", authenticated: user_signed_in? } }
    end
  end

  private

    def set_google_oauth_success
      @google_oauth_success = params[:google_oauth_success]
    end
end
