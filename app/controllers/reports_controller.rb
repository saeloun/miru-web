# frozen_string_literal: true

class ReportsController < ApplicationController
  skip_after_action :verify_authorized

  def index
    render :index
  end
end
