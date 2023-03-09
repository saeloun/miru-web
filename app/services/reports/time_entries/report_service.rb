# frozen_string_literal: true

class Reports::TimeEntries::ReportService
  attr_reader :params, :current_company, :get_filters
  attr_accessor :reports, :pagination_details

  def initialize(params, current_company, get_filters: false)
    @params = params
    @current_company = current_company
    @get_filters = get_filters
    @reports = nil
    @pagination_details = nil
  end

  def process
    process_reports
    {
      reports:,
      pagination_details:,
      filter_options:,
      client_logos:
    }
  end

  private

    def filter_options
      if get_filters
        @_filter_options ||= {
          clients: current_company.clients.includes([:logo_attachment]).order(:name),
          team_members: current_company.users.order(:first_name)
        }
      end
    end

    def process_reports
      default_filter = current_company_filter.merge(this_month_filter)
      where_clause = default_filter.merge(TimeEntries::Filters.process(params))
      if params[:group_by].present?
        reports_with_group_by(where_clause)
      else
        reports_without_group_by(where_clause)
      end
   end

    def reports_with_group_by(where_clause)
      page_service = Reports::TimeEntries::PageService.new(params, current_company)
      page_service.process
      search_result = TimesheetEntry.search(
        where: where_clause.merge(page_service.es_filter),
        order: { work_date: :desc },
        load: false
        )

      @reports = Reports::TimeEntries::Result.process(search_result, params[:group_by])
      @pagination_details = page_service.pagination_details
   end

    def reports_without_group_by(where_clause)
      search_result = TimesheetEntry.search(
        where: where_clause,
        order: { work_date: :desc },
        page: params[:page],
        load: false
        )
      @reports = Reports::TimeEntries::Result.process(search_result, params[:group_by])
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

    def client_logos
      if filter_options
        filter_options[:clients].map do | client |
          [client.id, client.logo_url]
        end.to_h
      end
   end

    def current_company_filter
      { project_id: current_company.project_ids }
   end

    def this_month_filter
      { work_date: DateTime.current.beginning_of_month..DateTime.current.end_of_month }
   end
end
