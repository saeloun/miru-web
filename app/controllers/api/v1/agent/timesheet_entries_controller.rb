# frozen_string_literal: true

class Api::V1::Agent::TimesheetEntriesController < Api::V1::Agent::BaseController
  def create
    timesheet_entry = project.timesheet_entries.new(
      duration: agent_timesheet_entry_params[:duration_minutes],
      work_date: agent_timesheet_entry_params[:work_date],
      note: agent_timesheet_entry_params[:note],
      source: "automation",
      source_metadata: agent_timesheet_entry_params[:source_metadata],
      proof_url: agent_timesheet_entry_params[:proof_url],
      proof_metadata: agent_timesheet_entry_params[:proof_metadata],
      external_run_id: agent_timesheet_entry_params[:external_run_id],
      external_session_id: agent_timesheet_entry_params[:external_session_id],
      agent: current_agent
    )
    timesheet_entry.user = current_agent.user
    timesheet_entry.save!

    render json: {
      notice: I18n.t("timesheet_entry.create.message"),
      entry: timesheet_entry.snippet
    }, status: 200
  end

  private

    def project
      @project ||= current_company.projects.kept.find(
        agent_timesheet_entry_params[:project_id].presence || current_agent.default_project_id
      )
    end

    def agent_timesheet_entry_params
      params.require(:timesheet_entry).permit(
        :project_id,
        :duration_minutes,
        :work_date,
        :note,
        :proof_url,
        :external_run_id,
        :external_session_id,
        source_metadata: {},
        proof_metadata: {}
      )
    end
end
