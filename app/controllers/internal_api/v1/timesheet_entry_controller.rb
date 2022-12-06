# frozen_string_literal: true

class InternalApi::V1::TimesheetEntryController < InternalApi::V1::ApplicationController
  include Timesheet

  skip_after_action :verify_authorized, only: [:index]
  after_action :verify_policy_scoped, only: [:index]

  def index
    timesheet_entries = policy_scope(TimesheetEntry)
    timesheet_entries = timesheet_entries.where(user_id: params[:user_id] || current_user.id).during(
      params[:from],
      params[:to]
    )
    entries = TimesheetEntryPresenters::GroupByDatePresenter.new(timesheet_entries).format_entries
    entries[:currentUserRole] = current_user.primary_role current_company
    render json: { entries: }, status: :ok
  end

  def create
    authorize TimesheetEntry
    timesheet_entry = current_project.timesheet_entries.new(timesheet_entry_params)
    timesheet_entry.user = current_company.users.find(params[:user_id])
    render json: {
      notice: I18n.t("timesheet_entry.create.message"),
      entry: timesheet_entry.formatted_entry
    } if timesheet_entry.save!
  end

  def update
    authorize current_timesheet_entry
    current_timesheet_entry.project = current_project
    current_timesheet_entry.update!(timesheet_entry_params)
    render json: { notice: I18n.t("timesheet_entry.update.message"), entry: current_timesheet_entry.formatted_entry },
      status: :ok
  end

  def destroy
    authorize current_timesheet_entry
    render json: { notice: I18n.t("timesheet_entry.destroy.message") } if current_timesheet_entry.destroy
  end

  private

    def current_project
      @_current_project ||= current_company.projects.kept.find(params[:project_id])
    end

    def current_timesheet_entry
      @_current_timesheet_entry ||= current_company.timesheet_entries.find(params[:id])
    end

    def timesheet_entry_params
      params.require(:timesheet_entry).permit(:project_id, :duration, :work_date, :note, :bill_status)
    end
end
