# frozen_string_literal: true

class HomeController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  before_action :set_google_oauth_success

  def index
    if current_user && current_user.has_role?(:super_admin)
      redirect_to admin_root_path
    else
      respond_to do |format|
        format.html { render }
        format.json { head :not_found }
      end
    end
  end

  private

    def set_google_oauth_success
      @google_oauth_success = params[:google_oauth_success]
    end
end
