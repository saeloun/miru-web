# frozen_string_literal: true

class ApplicationController < ActionController::Base
  before_action :authenticate_user!

  def redirect_path
    path = case current_user.role
           when "owner" || "admin"
             dashboard_index_path
           else
             time_trackings_path
    end
    redirect_to path
  end
end
