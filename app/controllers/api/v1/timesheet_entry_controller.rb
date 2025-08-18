# frozen_string_literal: true

class Api::V1::TimesheetEntryController < Api::V1::ApplicationController
  before_action :ensure_project_member, only: [:create]
  after_action :verify_authorized, except: [:index]

  def index
    from_date = params[:from] || Date.current.beginning_of_week.to_s
    to_date = params[:to] || Date.current.end_of_week.to_s
    user_id = params[:user_id] || current_user.id

    timesheet_entries = current_company.timesheet_entries
      .joins(:project)
      .where(user_id: user_id)
      .where(work_date: from_date..to_date)
      .includes(:project, :user)
      .order(work_date: :desc)

    # Group entries by date for the expected format
    entries_by_date = {}
    timesheet_entries.each do |entry|
      date_key = entry.work_date.strftime("%F")
      entries_by_date[date_key] ||= []
      entries_by_date[date_key] << {
        id: entry.id.to_s,
        date: entry.work_date.to_s,
        client: entry.project.client&.name || "No Client",
        project: entry.project.name,
        task: entry.note || "",
        description: entry.note || "",
        duration: entry.duration.to_i,  # duration is stored in minutes as a float
        billable: entry.bill_status == "billable",
        status: "pending",
        userId: entry.user_id.to_s,
        userName: entry.user.full_name
      }
    end

    render json: { entries: entries_by_date }
  end

  def create
    authorize TimesheetEntry
    timesheet_entry = project.timesheet_entries.new(timesheet_entry_params)
    timesheet_entry.user = current_user
    timesheet_entry.save!
    render json: {
      notice: "Time entry created successfully",
      entry: {
        id: timesheet_entry.id.to_s,
        date: timesheet_entry.work_date.to_s,
        client: project.client&.name || "No Client",
        project: project.name,
        description: timesheet_entry.note || "",
        duration: timesheet_entry.duration.to_i,
        billable: timesheet_entry.bill_status == "billable"
      }
    }, status: 201
  end

  def update
    timesheet_entry = current_company.timesheet_entries.find(params[:id])
    timesheet_entry.update!(timesheet_entry_params)
    render json: {
      notice: I18n.t("timesheet_entry.update.message"),
      entry: timesheet_entry
    }
  end

  def destroy
    timesheet_entry = current_company.timesheet_entries.find(params[:id])
    timesheet_entry.destroy!
    render json: {
      notice: I18n.t("timesheet_entry.destroy.message")
    }
  end

  private

    def project_member
      ProjectMember.find_by(user_id: current_user.id, project_id: project.id)
    end

    def project
      # Handle project_id from either top-level params or nested in timesheet_entry
      project_id = params[:project_id] || params.dig(:timesheet_entry, :project_id)
      @_project ||= current_company.projects.kept.find(project_id)
    end

    def timesheet_entry_params
      params.require(:timesheet_entry).permit(
        :project_id, :duration, :work_date, :note, :bill_status)
    end

    def ensure_project_member
      render json: { notice: "User is not a project member." }, status: 403 if project_member.blank?
    end
end
