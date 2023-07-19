# frozen_string_literal: true

class Reports::TimeEntries::ReportService
  include Pagy::Backend
  attr_reader :params, :current_company, :get_filters
  attr_accessor :reports, :pagination_details, :pagy_data

  def initialize(params, current_company, get_filters: false)
    @params = params
    @current_company = current_company
    @get_filters = get_filters
    @reports = nil
    @pagination_details = nil
    @pagy_data = nil
  end

  def process
    fetch_reports
    {
      reports: Reports::TimeEntries::Result.process(reports, params[:group_by]),
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
          team_members: users_not_client_role.order(:first_name)
        }
      end
    end

    def fetch_reports
      default_filter = current_company_filter.merge(this_month_filter)
      where_clause = default_filter.merge(TimeEntries::Filters.process(params))
      pagy_reports(where_clause)
   end

    def pagy_reports(where_clause)
      page_service = Reports::TimeEntries::PageService.new(params, current_company)
      page_service.process

      search_results = search_timesheet_entries(where_clause.merge(page_service.es_filter))

      pagination_details_for_es_query(search_results)
   end

    def change_pagination(page)
      page > 0 ? [page - 1, 1].max : page
    end

    def pagination_details_for_es_query(search_result)
      @pagy_data, paginated_data = pagy_searchkick(
        search_result,
        items: Reports::TimeEntries::PageService::DEFAULT_ITEMS_PER_PAGE,
        page: params[:page]
      )
      @reports = paginated_data
      pagination_details
    end

    def search_timesheet_entries(where_clause, page = nil)
      TimesheetEntry.pagy_search(
        where: where_clause,
        order: { work_date: :desc },
        page: params[:page],
        load: false
        )
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

    def users_not_client_role
      users_with_client_role_ids = current_company.users.joins(:roles).where(roles: { name: "client" }).pluck(:id)
      current_company.users.where.not(id: users_with_client_role_ids)
    end

    def pagination_details
      {
        pages: pagy_data.pages,
        first: pagy_data.page == 1,
        prev: pagy_data.prev.nil? ? 0 : pagy_data.prev,
        next: pagy_data.next,
        last: pagy_data.last,
        page: pagy_data.page,
        items: pagy_data.items
      }
    end
end
