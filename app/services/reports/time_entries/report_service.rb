# frozen_string_literal: true

module Reports::TimeEntries
  class ReportService
    attr_reader :params, :is_download_request, :current_company
    attr_accessor :reports, :pagination_details

    def initialize(params, current_company, download: false)
      @params = params
      @current_company = current_company
      @is_download_request = is_download_request
      @reports = nil
      @pagination_details = nil
    end

    def process
      process_reports
      {
        reports:,
        entries: reports.map { |e| e[:entries] }.flatten,
        filter_options:,
        pagination_details:

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

      def process_reports
        default_filter = current_company_filter.merge(this_month_filter)
        where_clause = default_filter.merge(TimeEntries::Filters.process(params))
        if params["group_by"].present?
          reports_with_group_by(where_clause)
        else
          reports_without_group_by(where_clause)
        end
      end

      def reports_with_group_by(where_clause)
        @pagination_details, es_filter_for_pagination = Reports::TimeEntries::PageService.process(
          params,
          current_company)

        search_result = TimesheetEntry.search(
          where: where_clause.merge(es_filter_for_pagination),
          order: { work_date: :desc },
          load: false
          )

        @reports = Reports::TimeEntries::Result.process(search_result, params["group_by"])
      end

      def reports_without_group_by(where_clause)
        search_result = TimesheetEntry.search(
          where: where_clause,
          order: { work_date: :desc },
          page: params[:page],
          load: false
          )
        @reports = Reports::TimeEntries::Result.process(search_result, params["group_by"])
        @pagination_details = pagination_details_for_es_query(search_result)
      end

      def pagination_details_for_es_query(search_result)
        {
          pages: search_result.total_pages,
          first: search_result.first_page?,
          prev: search_result.prev_page,
          next: search_result.next_page,
          last: search_result.last_page?
        }
      end

      def current_company_filter
        { project_id: current_company.project_ids }
      end

      def this_month_filter
        { work_date: DateTime.current.beginning_of_month..DateTime.current.end_of_month }
      end
  end
end
