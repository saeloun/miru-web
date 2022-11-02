# frozen_string_literal: true

class Api::V1::TimesheetEntryController < Api::V1::BaseController
  include Timesheet

  def create
    if ProjectMember.find_by(user_id: user.id, project_id: project.id)
      timesheet_entry = project.timesheet_entries.new(timesheet_entry_params)
      timesheet_entry.user = current_company.users.find(params[:user_id])
      render json: {
        notice: I18n.t("timesheet_entry.create.message"),
        entry: timesheet_entry.formatted_entry
      } if timesheet_entry.save!
    else
      render json: {
        notice: "User is not a project member"
      }
    end
  end

  private

    def user
      @_user ||= User.find_by(id: params[:user_id])
    end

    def current_company
      @_current_company ||= Company.find_by(id: params[:current_company])
    end

    def project
      @_project ||= current_company.projects.find(params[:project_id])
    end

    def timesheet_entry_params
      params.require(:timesheet_entry).permit(
        :project_id, :duration, :work_date, :note, :bill_status,
        :current_company, :auth_token)
    end
end
