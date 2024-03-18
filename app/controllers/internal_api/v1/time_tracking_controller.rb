# frozen_string_literal: true

# TODO: Refactoring -> can be merge with time entries controller
class InternalApi::V1::TimeTrackingController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized
  before_action :set_user, only: [:index]

  def index
    authorize :index, policy_class: TimeTrackingPolicy
    year = params[:year] || Date.today.year
    from = params[:from] || Time.current.beginning_of_month
    to = params[:to] || Time.current.end_of_month

    data = TimeTrackingIndexService.new(current_user:, user: @user, company: current_company, from:, to:, year:).process

    render :index, locals: {
      clients: data[:clients],
      employees: data[:employees],
      entries: data[:entries],
      holiday_infos: data[:holiday_infos],
      leave_types: data[:leave_types],
      projects: data[:projects],
      company: current_company
    }, status: :ok
  end

  private

    def set_user
      user_id = params[:user_id] || current_user.id
      @user = current_company.users.find(user_id)
    end
end
