# frozen_string_literal: true

class InternalApi::V1::ReportsController < InternalApi::V1::ApplicationController
  include Timesheet

  def index
    authorize :report
    render :index, locals: { entries:, filter_options: }, status: :ok
  end

  private

    def filter_options
      # Send filter options only when page loads
      # and not for other requests where user is doing filtering on reports page
      return {} if any_filter_added?

      @_filter_options ||= { clients: current_company.clients, team_members: current_company.users }
    end

    def any_filter_added?
      params[:date_range].present? ||
      params[:status].present? ||
      params[:team_member].present? ||
      params[:team_member].present?
    end

    def entries
      current_company_project_ids_filter = { project_id: current_company.project_ids }
      filters_where_clause = Report::Filters.process(params)
      where_clause = current_company_project_ids_filter.merge(filters_where_clause)
      TimesheetEntry.search(where: where_clause, includes: [:user, :project])
    end
end
