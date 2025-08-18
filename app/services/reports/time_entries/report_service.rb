# frozen_string_literal: true

class Reports::TimeEntries::ReportService
  include Pagy::Backend
  attr_reader :params, :current_company, :get_filters
  attr_accessor :reports, :pagy_data

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
      client_logos:,
      group_by_total_duration:
    }
  end

  private

    def filter_options
      if get_filters
        @_filter_options ||= {
          clients: current_company.clients.includes([:logo_attachment]).order(:name),
          team_members: current_company.employees_without_client_role.order(:first_name),
          projects: current_company.projects.as_json(only: [:id, :name])
        }
      end
    end

    def fetch_reports
      default_filter = current_company_filter.merge(this_month_filter).merge(active_time_entries)
      where_clause = default_filter.merge(TimeEntries::Filters.process(params))
      pagy_reports(where_clause)
    end

    def pagy_reports(where_clause)
      filter_service = Reports::TimeEntries::FilterService.new(params, current_company)
      filter_service.process

      # Convert client_id to project_id for TimesheetEntry filtering
      filter_hash = filter_service.es_filter
      if filter_hash[:client_id]
        project_ids = Project.where(client_id: filter_hash[:client_id]).pluck(:id)
        filter_hash = { project_id: project_ids }
      end

      entries = search_timesheet_entries(where_clause.merge(filter_hash))

      # Use Pagy for pagination
      @pagy_data, @reports = pagy(entries, items: 50, page: params[:page])
    end

    def search_timesheet_entries(where_clause, page = nil)
      # Build the base query with necessary joins for ordering
      base_query = TimesheetEntry.includes(:user, project: :client)

      # Apply where conditions
      where_clause.each do |key, value|
        base_query = if value.is_a?(Hash) && value.key?(:not)
          base_query.where.not(key => value[:not])
        else
          base_query.where(key => value)
        end
      end

      # Apply ordering based on group_by parameter
      ordered_query = case params[:group_by]
                      when "project"
                        base_query.joins(:project).order("projects.name ASC, work_date DESC")
                      when "team_member"
                        base_query.joins(:user).order("users.first_name ASC, users.last_name ASC, work_date DESC")
                      when "client"
                        base_query.joins(project: :client).order("clients.name ASC, work_date DESC")
                      else
                        base_query.joins(project: :client).order("clients.name ASC, work_date DESC")
      end

      # Return the query result with pagination if needed
      if page
        ordered_query.page(page).per(50)
      else
        ordered_query
      end
    end

    def group_by_total_duration
      group_by = params[:group_by]&.to_sym || :client
      return unless [:client, :project, :team_member].include?(group_by)

      # Use the same where clause as the main query
      default_filter = current_company_filter.merge(this_month_filter).merge(active_time_entries)
      where_conditions = default_filter.merge(TimeEntries::Filters.process(params))

      joins_clause, group_field = case group_by
                                  when :client
                                    [{ project: :client }, "clients.id"]
                                  when :project
                                    [:project, "projects.id"]
                                  when :team_member
                                    [:user, "users.id"]
                                  else
                                    raise ArgumentError, "Unsupported group_by: #{group_by}"
      end

      # Convert client_id filter to proper join condition
      if where_conditions.key?(:client_id)
        project_ids = Project.where(client_id: where_conditions[:client_id]).pluck(:id)
        where_conditions[:project_id] = project_ids
        where_conditions.delete(:client_id)
      end

      grouped_durations = TimesheetEntry.kept.joins(joins_clause)
        .where(where_conditions)
        .group(group_field)
        .sum(:duration)

      descriptive_aggregated_data = {
        group_by:,
        grouped_durations:
      }

      descriptive_aggregated_data
  end

    def client_logos
      if filter_options
        filter_options[:clients].to_h do | client |
          [client.id, client.logo_url]
        end
      end
    end

    def current_company_filter
      { project_id: current_company.project_ids }
    end

    def this_month_filter
      { work_date: DateTime.current.beginning_of_month..DateTime.current.end_of_month }
    end

    def active_time_entries
      { discarded_at: nil }
    end

    def pagination_details
      return {} unless @pagy_data

      {
        pages: @pagy_data.pages,
        first: @pagy_data.page == 1,
        prev: @pagy_data.prev,
        next: @pagy_data.next,
        last: @pagy_data.page == @pagy_data.pages,
        page: @pagy_data.page
      }
    end
end
