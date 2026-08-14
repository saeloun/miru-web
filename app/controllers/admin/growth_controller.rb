# frozen_string_literal: true

class Admin::GrowthController < ApplicationController
  skip_after_action :verify_authorized

  def show
    @metrics = Analytics::GrowthMetricsService.process
    render layout: false
  end
end
