# frozen_string_literal: true

class Reports::TimeEntries::PageService < ApplicationService
  include Pagy::Backend
  # pagy_config skip_empty_pages: true

  attr_reader :params, :page, :group_by, :current_company, :pagy_data, :es_filter, :reports

  PER_PAGE = {
    users: 5,
    clients: 3,
    projects: 3
  }
  DEFAULT_ITEMS_PER_PAGE = 20

  def initialize(params, current_company)
    @params = params
    @page = params["page"]
    @group_by = params[:group_by]
    @current_company = current_company
    @pagy_data = nil
    @reports = nil

    @es_filter = nil
  end

  def process
    es_filter_for_pagination
  end

  def pagination_details
    {
      page: pagy_data.page,
      pages: pagy_data.pages,
      first: pagy_data.page == 1,
      prev: pagy_data.prev.nil? ? 0 : pagy_data.prev,
      next: pagy_data.next,
      last: pagy_data.last
    }
  end

  def reports_with_group_by(where_clause)
    page_service = Reports::TimeEntries::PageService.new(params, current_company)
    page_service.process

    search_results = search_timesheet_entries(where_clause.merge(page_service.es_filter))
    hash_name = params[:group_by] == "team_member" ? "client" : params[:group_by]

    pagy_data, paginated_data = pagy(
      search_results,
      items: Reports::TimeEntries::PageService::PER_PAGE[hash_name.to_sym],
      page: params[:page],
      count: search_results.size
    )
    @reports = paginated_data
    @pagination_details = {
      pages: pagy_data.pages,
      first: pagy_data.page == 1,
      prev: pagy_data.prev.nil? ? 0 : pagy_data.prev,
      next: pagy_data.next,
      last: pagy_data.last,
      page: pagy_data.page,
      items: pagy_data.items
    }
   end

  def reports_without_group_by(where_clause)
    page_service = Reports::TimeEntries::PageService.new(params, current_company)
    page_service.process

    @reports = search_timesheet_entries(where_clause.merge(page_service.es_filter))
    @pagination_details = if params[:date_range] == "custom"
      page_service.pagination_details
    else
      pagination_details_for_es_query(@reports)
    end
 end

  def pagination_details_for_es_query(search_result)
    pagy_data, paginated_data = pagy(
      search_result,
      items: Reports::TimeEntries::PageService::DEFAULT_ITEMS_PER_PAGE,
      page: params[:page], count: search_result.size
    )
    @reports = paginated_data
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

  def search_timesheet_entries(where_clause, page = nil)
    TimesheetEntry.search(
      where: where_clause,
      order: { work_date: :desc },
      page:,
      load: false
      )
  end

  private

    def es_filter_for_pagination
      if Reports::TimeEntries::GroupBy.new(group_by).valid_group_by?
        send("#{group_by}_filter")
      else
        params[:date_range] == "custom" ? set_default_pagination_data : @es_filter = {}
      end
    end

    def set_default_pagination_data
      total_records = if params[:group_by].present?
        reports.total_count
      else
        @reports = TimesheetEntry.search(where: {}, load: false)
        @reports.total_entries
      end

      @pagy_data, paginated_data = pagy(@reports, items: DEFAULT_ITEMS_PER_PAGE, page:, count: total_records)
      @es_filter = { id: paginated_data.results.map { |data| data.except("_id", "_index", "_score") }.pluck(:id) }
    end

    def team_member_filter
      @es_filter = { user_id: users_query.pluck(:id) }
    end

    def client_filter
      @es_filter = { client_id: clients_query.pluck(:id) }
    end

    def project_filter
      @es_filter = { project_id: projects_query.pluck(:id) }
    end

    def users_query
      current_company.users
        .with_ids(params[:team_member])
        .order(:first_name)
        .select(:id)
    end

    def clients_query
      current_company.clients
        .with_ids(params[:client])
        .order(:name)
        .select(:id)
    end

    def projects_query
      current_company.projects
        .with_ids(params[:project])
        .order(:name)
        .select(:id)
    end
end
