# frozen_string_literal: true

class InternalApi::V1::ReportsController < InternalApi::V1::ApplicationController
  include Timesheet

  def index
    authorize :report
    render :index, locals: { entries: filtered_reports, filter_options: }, status: :ok
  end

  def create
    authorize :report

    respond_to do |format|
      format.csv { send_reports_csv(entries) }
      format.any { render json: { entries: }, status: :ok }
    end
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

    def filtered_reports
      current_company_project_ids_filter = { project_id: current_company.project_ids }
      filters_where_clause = Report::Filters.process(params)
      where_clause = current_company_project_ids_filter.merge(filters_where_clause)
      TimesheetEntry.search(where: where_clause, includes: [:user, :project])
    end

    def send_reports_csv(entries)
      headers = %w[project/headers note team_member date hours_logged].map(&:titleize)
      csv_data = CSV.generate(headers: true) do |csv|
        csv << headers

        entries.each do |entry|
          csv_row = []

          csv_row << entry["project"]
          csv_row << entry["note"]
          csv_row << entry["teamMember"]
          csv_row << entry["workDate"]
          csv_row << minutes_to_hh_mm(entry["duration"])

          csv << csv_row
        end
      end
      send_data(csv_data, filename: "reports.csv")
    end

    def minutes_to_hh_mm(duration)
      if duration.nil? || duration <= 0
        "00:00"
      else
        hours = (duration / 60).to_s.split(".")[0]
        minutes = (duration % 60).to_s.delete(".")
        hours = "0#{hours}" if hours.size == 1
        minutes = "0#{minutes}" if minutes.size == 3
        "#{hours}:#{minutes}"
      end
    end
end
