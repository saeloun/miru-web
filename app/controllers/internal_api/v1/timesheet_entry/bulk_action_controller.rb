# frozen_string_literal: true

class InternalApi::V1::TimesheetEntry::BulkActionController < InternalApi::V1::ApplicationController
  include Timesheet

  skip_after_action :verify_authorized, only: [:update, :destroy]
  after_action :verify_policy_scoped, only: [:update, :destroy]

  def update
    timesheet_entries = policy_scope(TimesheetEntry)
    timesheet_entries.where(id: params[:ids]).update(project_id: params[:project_id])
    entries = TimesheetEntryPresenters::GroupByDatePresenter.new(timesheet_entries).format_entries
    render json: { notice: I18n.t("timesheet_entry.update.message"), entries: }, status: :ok
  end

  def destroy
    timesheet_entries = policy_scope(TimesheetEntry)
    if timesheet_entries.where(id: ids_params).destroy_all
      render json: { notice: I18n.t("timesheet_entry.destroy.message") }
    end
  end

  private

    def ids_params
      params.require(:source).require(:ids)
    end
end
