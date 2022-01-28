# frozen_string_literal: true

class Api::V1::TimesheetEntryController < ApplicationController
  def index
    timesheet_entries = current_user.timesheet_entries.order(work_date: :desc)
    render json: timesheet_entries
  end

  def update
    @timesheet_entry = TimesheetEntry.find(params[:id])
    if @timesheet_entry.update(timesheet_entry_params)
      render json: @timesheet_entry
    else
      render json: @timesheet_entry.errors, status: :unprocessable_entity
    end
  end

  def create
    @timesheet_entry = TimesheetEntry.new(timesheet_entry_params)
    if @timesheet_entry.save
      render json: { success: true }
    else
      render json: @timesheet_entry.errors, status: :unprocessable_entity
    end
  end

  private
    def timesheet_entry_params
      params.require(:timesheet_entry).permit(:project_id, :hours, :work_date, :description)
    end
end
