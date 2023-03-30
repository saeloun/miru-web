# frozen_string_literal: true

class HomeController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  before_action :set_google_oauth_success

  def index
    render
  end

  private

    def set_google_oauth_success
      @google_oauth_success = params[:google_oauth_success]
    end
end
