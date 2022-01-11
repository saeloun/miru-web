# frozen_string_literal: true

class RootController < ApplicationController
  def index
    path = if current_user.has_any_role?(:owner, :admin)
      dashboard_index_path
    else
      time_trackings_path
    end

    redirect_to path
  end
end
