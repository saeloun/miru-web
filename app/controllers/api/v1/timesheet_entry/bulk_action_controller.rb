# frozen_string_literal: true

class Api::V1::TimesheetEntry::BulkActionController < Api::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:update, :destroy]
  after_action :verify_policy_scoped, only: [:update, :destroy]

  def update
    timesheet_entries = policy_scope(TimesheetEntry)
    timesheet_entries.where(id: params[:ids]).update(project_id: params[:project_id])
    entries = TimesheetEntriesPresenter.new(timesheet_entries).group_snippets_by_work_date
    render json: { notice: I18n.t("timesheet_entry.update.message"), entries: }, status: 200
  end

  def destroy
    timesheet_entries = policy_scope(TimesheetEntry)
    entries_to_discard = timesheet_entries.where(id: ids_params)
    discarded_entries = entries_to_discard.discard_all
    if discarded_entries.any?
      render json: { notice: I18n.t("timesheet_entry.destroy.message") }
    else
      render json: { error: I18n.t("timesheet_entry.destroy.failure", default: "Failed to delete timesheet entries") }, status: :unprocessable_entity
    end
  end

  private

    def ids_params
      params.require(:source).require(:ids)
    end
end
