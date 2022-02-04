# frozen_string_literal: true

class InternalApi::V1::TimesheetEntryController < ApplicationController
  skip_before_action :verify_authenticity_token

  def index
    timesheet_entries = current_user.timesheet_entries.where(work_date: params[:from]..params[:to]).order(work_date: :desc)
    entries = {}
    timesheet_entries.map do |entry|
      entries[entry.work_date] ||= []
      entries[entry.work_date] << entry.formatted_entry
    end
    render json: { success: true, entries: entries }
  end

  def create
    project = Project.find_by(name: params[:project_name])
    timesheet_entry = project.timesheet_entries.new(timesheet_entry_params)
    timesheet_entry.user = current_user
    if timesheet_entry.save
      render json: { success: true, entry: timesheet_entry.formatted_entry }
    else
      render json: timesheet_entry.errors, status: :unprocessable_entity
    end
  end

  def update
    timesheet_entry = TimesheetEntry.find(params[:id])
    project = Project.find_by(name: params[:project_name])
    timesheet_entry.project = project
    if timesheet_entry.update(timesheet_entry_params)
      render json: { success: true, entry: timesheet_entry.formatted_entry }
    else
      render json: timesheet_entry.errors, status: :unprocessable_entity
    end
  end

  def destroy
    timesheet_entry = TimesheetEntry.find(params[:id])
    if timesheet_entry.destroy
      render json: { success: true }
    else
      render json: timesheet_entry.errors, status: :unprocessable_entity
    end
  end


  private
    def timesheet_entry_params
      params.require(:timesheet_entry).permit(:duration, :work_date, :note)
    end
end
