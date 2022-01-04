# frozen_string_literal: true

class RootController < ApplicationController
  def index
    path = case current_user.role
           when "owner" || "admin"
             dashboard_index_path
           else
             time_trackings_path
    end
    redirect_to path
  end
end
