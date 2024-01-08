# frozen_string_literal: true

# TODO: Refactoring -> can be merge with time entries controller
class InternalApi::V1::TimeTrackingController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized

  def index
    authorize :index, policy_class: TimeTrackingPolicy
    user = params[:user_id] || current_user
    year = params[:year] || Date.today.year
    from = params[:from] || 1.month.ago.beginning_of_month
    to = params[:to] || 1.month.since.end_of_month

    data = TimeTrackingIndexService.new(user, current_company, from, to, year).process
    render json: data, status: :ok
  end
end
