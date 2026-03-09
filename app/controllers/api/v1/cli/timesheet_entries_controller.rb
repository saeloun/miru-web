# frozen_string_literal: true

class Api::V1::Cli::TimesheetEntriesController < Api::V1::Cli::BaseController
  def create
    authorize TimesheetEntry

    timesheet_entry = project.timesheet_entries.new(
      duration: cli_timesheet_entry_params[:duration_minutes],
      work_date: cli_timesheet_entry_params[:work_date],
      note: cli_timesheet_entry_params[:note],
      bill_status: cli_timesheet_entry_params[:bill_status]
    )
    timesheet_entry.user = current_user
    timesheet_entry.save!

    render json: {
      notice: I18n.t("timesheet_entry.create.message"),
      entry: timesheet_entry.snippet
    }, status: 200
  end

  def update
    authorize current_timesheet_entry

    current_timesheet_entry.project = project
    current_timesheet_entry.update!(
      duration: cli_timesheet_entry_params[:duration_minutes],
      work_date: cli_timesheet_entry_params[:work_date],
      note: cli_timesheet_entry_params[:note],
      bill_status: cli_timesheet_entry_params[:bill_status]
    )

    render json: {
      notice: I18n.t("timesheet_entry.update.message"),
      entry: current_timesheet_entry.snippet
    }, status: 200
  end

  def destroy
    authorize current_timesheet_entry

    current_timesheet_entry.discard!

    render json: { notice: I18n.t("timesheet_entry.destroy.message") }, status: 200
  end

  private

    def project
      @_project ||= ProjectPolicy::Scope.new(current_user, current_company).resolve.find(cli_timesheet_entry_params[:project_id])
    end

    def current_timesheet_entry
      @_current_timesheet_entry ||= current_user.timesheet_entries.kept.in_workspace(current_company).find(params[:id])
    end

    def cli_timesheet_entry_params
      params.require(:timesheet_entry).permit(:project_id, :duration_minutes, :work_date, :note, :bill_status)
    end
end
