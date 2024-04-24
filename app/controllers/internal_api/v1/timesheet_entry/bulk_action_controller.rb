# frozen_string_literal: true

class InternalApi::V1::TimesheetEntry::BulkActionController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:update, :destroy]
  after_action :verify_policy_scoped, only: [:update, :destroy]

  def update
    timesheet_entries = policy_scope(TimesheetEntry)
    timesheet_entries.where(id: params[:ids]).update(project_id: params[:project_id])
    entries = TimesheetEntriesPresenter.new(timesheet_entries).group_snippets_by_work_date
    render json: { notice: I18n.t("timesheet_entry.update.message"), entries: }, status: :ok
  end

  def destroy
    timesheet_entries = policy_scope(TimesheetEntry)
    timesheet_entries_discarded = timesheet_entries.where(id: ids_params).discard_all
    if timesheet_entries_discarded
      render json: { notice: I18n.t("timesheet_entry.destroy.message") }
    else
      render json: { notice: "Some of the timesheet entries were failed to delete" }
    end
  end

  private

    def ids_params
      params.require(:source).require(:ids)
    end
end
