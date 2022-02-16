# frozen_string_literal: true

class DashboardController < ApplicationController
  after_action :verify_authorized

  def index
    authorize :dashboard, :index?
    render
  end
end
