# frozen_string_literal: true

class Api::V1::TimesheetEntryController < Api::V1::ApplicationController
  include DateRangeParamParsing

  skip_after_action :verify_authorized, only: [:index]
  after_action :verify_policy_scoped, only: [:index]

  def index
    policy_scope(TimesheetEntry)
    user = current_company.users.find(selected_user_id)
    data = TimeTrackingIndexService.new(
      current_user: current_user,
      user: user,
      company: current_company,
      from: parsed_date_param(:from) || 1.month.ago.beginning_of_month,
      to: parsed_date_param(:to) || 1.month.since.end_of_month,
      year: params[:year] || Date.today.year
    ).entries_payload

    render :index, locals: {
      entries: data[:entries],
      holiday_infos: data[:holiday_infos],
      leave_types: data[:leave_types],
      company: current_company
    }, status: 200
  end

  def create
    authorize TimesheetEntry
    timesheet_entry = current_project.timesheet_entries.new(timesheet_entry_params)
    timesheet_entry.user = current_company.users.find(params[:user_id])
    render json: {
      notice: I18n.t("timesheet_entry.create.message"),
      entry: timesheet_entry.snippet
    } if timesheet_entry.save!
  end

  def update
    authorize current_timesheet_entry
    current_timesheet_entry.project = current_project
    current_timesheet_entry.update!(timesheet_entry_params)
    render json: { notice: I18n.t("timesheet_entry.update.message"), entry: current_timesheet_entry.snippet },
      status: 200
  end

  def destroy
    authorize current_timesheet_entry
    render json: { notice: I18n.t("timesheet_entry.destroy.message") } if current_timesheet_entry.discard!
  end

  private

    def selected_user_id
      return current_user.id unless current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)

      params[:user_id] || current_user.id
    end

    def current_project
      @_current_project ||= current_company.projects.kept.find(params[:project_id])
    end

    def current_timesheet_entry
      @_current_timesheet_entry ||= current_company.timesheet_entries.kept.find(params[:id])
    end

    def timesheet_entry_params
      params.require(:timesheet_entry).permit(:project_id, :duration, :work_date, :note, :bill_status)
    end
end
