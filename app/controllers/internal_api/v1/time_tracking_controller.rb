# frozen_string_literal: true

# TODO: Refactoring -> can be merge with time entries controller
class InternalApi::V1::TimeTrackingController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized

  def index
    authorize :index, policy_class: TimeTrackingPolicy
    data = TimeTrackingIndexService.new(current_user, current_company).process
    data[:entries] = TimesheetEntriesPresenter.new(data[:timesheet_entries]).group_snippets_by_work_date
    render json: data, status: :ok
  end

  private

    def format_timesheet_entries(timesheet_entries)
      entries = formatted_entries_by_date(timesheet_entries)
      entries[:currentUserRole] = current_user.primary_role current_company
      entries
    end
end
