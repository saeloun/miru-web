# frozen_string_literal: true

class RootController < ApplicationController
  skip_after_action :verify_authorized

  def index
    path = if current_user.has_any_role?(:owner, :admin)
      dashboard_index_path
    else
      time_tracking_index_path
    end

    redirect_to path
  end
end
