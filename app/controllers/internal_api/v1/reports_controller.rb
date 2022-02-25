# frozen_string_literal: true

class InternalApi::V1::ReportsController < InternalApi::V1::ApplicationController
  include Timesheet
  skip_after_action :verify_authorized

  def index
    timesheet_entries = current_user.timesheet_entries.during(params[:from], params[:to])
    entries = formatted_entries_by_date(timesheet_entries)
    render json: { success: true, entries: entries }
  end
end
