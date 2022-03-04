# frozen_string_literal: true

class InternalApi::V1::TimesheetEntryController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized
  include Timesheet

  skip_after_action :verify_authorized, only: [:index]
  after_action :verify_policy_scoped, only: [:index]

  def index
    timesheet_entries = policy_scope(TimesheetEntry)
    timesheet_entries = timesheet_entries.where(user_id: params[:user_id] || current_user.id).during(params[:from], params[:to])
    entries = formatted_entries_by_date(timesheet_entries)
    render json: { entries: entries }
  end

  def create
    authorize TimesheetEntry
    timesheet_entry = current_project.timesheet_entries.new(timesheet_entry_params)
    timesheet_entry.user = current_user
    render json: { notice: I18n.t("timesheet_entry.create.message"), entry: timesheet_entry.formatted_entry } if timesheet_entry.save
  end

  def update
    authorize current_timesheet_entry
    current_timesheet_entry.project = current_project
    render json: { notice: I18n.t("timesheet_entry.update.message"), entry: current_timesheet_entry.formatted_entry }, status: :ok if current_timesheet_entry.update(timesheet_entry_params)
  end

  def destroy
    authorize current_timesheet_entry
    render json: { notice: I18n.t("timesheet_entry.destroy.message") } if current_timesheet_entry.destroy
  end

  private
    def current_project
      @_current_project ||= current_company.projects.find(params[:project_id])
    end

    def current_timesheet_entry
      @_current_timesheet_entry ||= current_user.timesheet_entries.find(params[:id])
    end

    def timesheet_entry_params
      params.require(:timesheet_entry).permit(:project_id, :duration, :work_date, :note, :bill_status)
    end
end
