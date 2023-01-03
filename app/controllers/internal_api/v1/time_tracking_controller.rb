# frozen_string_literal: true

# TODO: Refactoring -> can be merge with time entries controller
class InternalApi::V1::TimeTrackingController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized

  def index
    authorize :index, policy_class: TimeTrackingPolicy
    data = TimeTrackingIndexService.new(current_user, current_company).process
    render json: data, status: :ok
  end
end
