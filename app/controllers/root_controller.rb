# frozen_string_literal: true

class RootController < ApplicationController
  skip_after_action :verify_authorized

  def index
    path = if current_user.has_book_keeper_role?(current_company)
      payments_path
    else
      time_tracking_index_path
    end

    # path = if current_user.has_owner_or_admin_role?(current_company)
    #   dashboard_index_path
    # else
    #   time_tracking_index_path
    # end

    redirect_to path
  end
end
