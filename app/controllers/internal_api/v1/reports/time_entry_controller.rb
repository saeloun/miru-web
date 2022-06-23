# frozen_string_literal: true

class InternalApi::V1::Reports::TimeEntryController < InternalApi::V1::ApplicationController
  include Timesheet

  def index
    authorize :report
    render :index, locals: { reports:, filter_options: }, status: :ok
  end

  def download
    authorize :report

    entries = reports.map { |e| e[:entries] }.flatten

    respond_to do |format|
      format.csv { send_data TimeEntryReport::GenerateCsv.new(entries).process }
      format.pdf { send_data TimeEntryReport::GeneratePdf.new(reports).process }
    end
  end

  private

    def filter_options
      @_filter_options ||= { clients: current_company.clients, team_members: current_company.users }
    end

    def reports
      default_filter = current_company_filter.merge(this_month_filter)
      where_clause = default_filter.merge(TimeEntryReport::Filters.process(params))
      group_by_clause = TimeEntryReport::GroupBy.process(params["group_by"])

      search_result = TimesheetEntry.search(
        where: where_clause,
        order: { work_date: :desc },
        body_options: group_by_clause,
        includes: [:user, { project: :client } ])

      TimeEntryReport::Result.process(search_result, params["group_by"])
    end

    def current_company_filter
      { project_id: current_company.project_ids }
    end

    def this_month_filter
      { work_date: DateTime.current.beginning_of_month..DateTime.current.end_of_month }
    end
end
