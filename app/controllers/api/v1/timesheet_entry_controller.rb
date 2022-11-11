# frozen_string_literal: true

class Api::V1::TimesheetEntryController < Api::V1::BaseController
  include Timesheet

  def create
    return render json: { status: 403, notice: "User is not a project member." }, status: 403 if project_member.blank?

    timesheet_entry = project.timesheet_entries.new(timesheet_entry_params)
    timesheet_entry.user = current_user
    timesheet_entry.save!
    render json: {
      notice: I18n.t("timesheet_entry.create.message"),
      entry: timesheet_entry.formatted_entry
    }
  end

  private

    def project_member
      ProjectMember.find_by(user_id: current_user.id, project_id: project.id)
    end

    def project
      @_project ||= current_company.projects.kept.find(params[:timesheet_entry][:project_id])
    end

    def timesheet_entry_params
      params.require(:timesheet_entry).permit(
        :project_id, :duration, :work_date, :note, :bill_status)
    end
end
