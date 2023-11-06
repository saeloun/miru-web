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
      filter_service = Reports::TimeEntries::FilterService.new(params, current_company)
      filter_service.process
      @reports = search_timesheet_entries(where_clause.merge(filter_service.es_filter))
    end

    def search_timesheet_entries(where_clause, page = nil)
      order_field = case params[:group_by]
                    when "project"
                      "project_name"
                    when "client"
                      "client_name"
                    when "team_member"
                      "user_name"
                    else
                      "work_date"
      end

      TimesheetEntry.search(
        where: where_clause,
        order: [order_field.to_sym => :asc, work_date: :desc],
        per_page: 50,
        page: params[:page],
        load: false,
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
        pages: @reports.total_pages,
        first: @reports.first_page?,
        prev: @reports.prev_page,
        next: @reports.next_page,
        last: @reports.last_page?
      }
    end
end
