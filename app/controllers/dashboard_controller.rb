# frozen_string_literal: true

class DashboardController < ApplicationController
  def index
    authorize :dashboard
    redirect_to root_path
  end
end
