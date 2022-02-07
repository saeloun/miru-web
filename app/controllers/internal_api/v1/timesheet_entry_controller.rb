# frozen_string_literal: true

class InternalApi::V1::TimesheetEntryController < ApplicationController
  include Timesheet

  attr_accessor :timesheet_entry, :project
  skip_before_action :verify_authenticity_token
  before_action :set_timesheet_entry, only: [:update, :destroy]
  before_action :set_project, only: [:create, :update]
  before_action :print_params
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

  def index
    timesheet_entries = current_user.timesheet_entries.during(params[:from], params[:to])
    entries = formatted_entries_by_date(timesheet_entries)
    render json: { success: true, entries: entries }
  end

  def create
    timesheet_entry = project.timesheet_entries.new(timesheet_entry_params)
    timesheet_entry.user = current_user
    if timesheet_entry.save
      render json: { success: true, entry: timesheet_entry.formatted_entry }
    else
      render json: timesheet_entry.errors, status: :unprocessable_entity
    end
  end

  def update
    timesheet_entry.project = project
    if timesheet_entry.update(timesheet_entry_params)
      render json: { success: true, entry: timesheet_entry.formatted_entry }
    else
      render json: timesheet_entry.errors, status: :unprocessable_entity
    end
  end

  def destroy
    if timesheet_entry.destroy
      render json: { success: true }
    else
      render json: timesheet_entry.errors, status: :unprocessable_entity
    end
  end

  private
    def print_params
      puts params
    end

    def set_project
      @project = Project.find_by(name: params[:project_name])
    end

    def set_timesheet_entry
      @timesheet_entry ||= TimesheetEntry.find(params[:id])
    end

    def timesheet_entry_params
      params.require(:timesheet_entry).permit(:project_id, :duration, :work_date, :note)
    end

    def record_not_found
      render json: { success: false, message: "Record not found" }
    end
end
