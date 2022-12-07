# frozen_string_literal: true

# TODO: Refactoring -> can be merge with time entries controller
class InternalApi::V1::TimeTrackingController < InternalApi::V1::ApplicationController
  include Timesheet
  skip_after_action :verify_authorized

  def index
    authorize :index, policy_class: TimeTrackingPolicy
    data = TimeTrackingIndexDetailsService.new(current_user, current_company).process
    data[:entries] = format_timesheet_entries(data[:timesheet_entries])
    render json: data, status: :ok
  end

  private

    def format_timesheet_entries(timesheet_entries)
      entries = formatted_entries_by_date(timesheet_entries)
      entries[:currentUserRole] = current_user.primary_role current_company
      entries
    end
end
