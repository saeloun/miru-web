# frozen_string_literal: true

class RootController < ApplicationController
  skip_after_action :verify_authorized

  def index
    path = current_user.has_role?(:book_keeper, current_company) ? "payments" : "time-tracking"
    redirect_to root_path + path
  end
end
