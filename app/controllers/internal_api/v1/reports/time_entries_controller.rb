# frozen_string_literal: true

class InternalApi::V1::Reports::TimeEntriesController < InternalApi::V1::ApplicationController
  def index
    authorize :report
    render :index,
      locals: Reports::TimeEntries::ReportService.new(params, current_company).process,
      status: :ok
  end

  def download
    authorize :report

    respond_to do |format|
      format.csv { send_data Reports::TimeEntries::GenerateCsv
        .new(Reports::TimeEntries::ReportService.new(params, current_company, true).process[:entries])
        .process
      }
      format.pdf { send_data Reports::TimeEntries::GeneratePdf.new(reports).process }
    end
  end

  private

    def filter_options
      @_filter_options ||= {
        clients: current_company.clients.order(:name),
        team_members: current_company.users.order(:first_name)
      }
    end

    def reports
      default_filter = current_company_filter.merge(this_month_filter)
      where_clause = default_filter.merge(TimeEntries::Filters.process(params))
      group_by_clause = Reports::TimeEntries::GroupBy.process(params["group_by"])
      search_result = TimesheetEntry.search(
        where: where_clause,
        order: { work_date: :desc },
        body_options: group_by_clause,
        includes: [:user, { project: :client }, :client ]
        )

      Reports::TimeEntries::Result.process(search_result, params["group_by"])
    end

    def current_company_filter
      { project_id: current_company.project_ids }
    end

    def this_month_filter
      { work_date: DateTime.current.beginning_of_month..DateTime.current.end_of_month }
    end
end
