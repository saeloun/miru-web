# frozen_string_literal: true

class InternalApi::V1::TimesheetEntry::BulkActionController < InternalApi::V1::ApplicationController
  include Timesheet

  skip_after_action :verify_authorized, only: [:update, :destroy]
  after_action :verify_policy_scoped, only: [:update, :destroy]

  def update
    timesheet_entries = policy_scope(TimesheetEntry)
    timesheet_entries.update(project_id: params[:project_id]) if params[:project_id]
    entries = formatted_entries_by_date(timesheet_entries)
    render json: { notice: I18n.t("timesheet_entry.update.message"), entries: entries }, status: :ok
  end

  def destroy
    timesheet_entries = policy_scope(TimesheetEntry)
    if timesheet_entries.where(id: params[:ids].split(",")).destroy_all
      render json: { notice: I18n.t("timesheet_entry.destroy.message") }
    end
  end
end
