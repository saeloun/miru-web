# frozen_string_literal: true

class InternalApi::V1::TimesheetEntryController < InternalApi::V1::ApplicationController
  include Timesheet

  before_action :check_bill_status, only: [:create, :update]

  def index
    timesheet_entries = current_user.timesheet_entries.during(params[:from], params[:to])
    entries = formatted_entries_by_date(timesheet_entries)
    render json: { success: true, entries: entries }
  end

  def create
    timesheet_entry = current_project.timesheet_entries.new(timesheet_entry_params)
    timesheet_entry.user = current_user
    if timesheet_entry.save
      render json: { success: true, entry: timesheet_entry.formatted_entry }
    else
      render json: timesheet_entry.errors, status: :unprocessable_entity
    end
  end

  def update
    current_timesheet_entry.project = current_project
    if current_timesheet_entry.update(timesheet_entry_params)
      render json: { success: true, entry: current_timesheet_entry.formatted_entry }
    else
      render json: timesheet_entry.errors, status: :unprocessable_entity
    end
  end

  def destroy
    if current_timesheet_entry.destroy
      render json: { success: true }
    else
      render json: timesheet_entry.errors, status: :unprocessable_entity
    end
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

    def check_bill_status
      if timesheet_entry_params[:bill_status] == "billed"
        render json: { success: false, error: "You cannot bill an entry that has already been billed" }, status: :unprocessable_entity
      end
    end
end
