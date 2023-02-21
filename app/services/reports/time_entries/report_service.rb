# frozen_string_literal: true

module Reports::TimeEntries
  class ReportService
    attr_reader :params, :is_download_request, :current_company

    def initialize(params, current_company, download: false)
      @params = params
      @current_company = current_company
      @is_download_request = is_download_request
    end

    def process
      {
        reports:,
        entries: reports.map { |e| e[:entries] }.flatten,
        filter_options:
      }
    end

    private

      def filter_options
        if !is_download_request
          @_filter_options ||= {
            clients: current_company.clients.order(:name),
            team_members: current_company.users.order(:first_name)
          }
        end
       end

      def reports
        default_filter = current_company_filter.merge(this_month_filter)
        where_clause = default_filter.merge(TimeEntries::Filters.process(params))
        group_by_clause = Reports::TimeEntries::GroupBy.process(params["group_by"])
        search_result = TimesheetEntry.search(
          where: where_clause,
          order: { work_date: :desc },
          body_options: group_by_clause,
          includes: [:user, { project: :client }, :client, :company ]
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
end
