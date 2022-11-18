# frozen_string_literal: true

class InternalApi::V1::Reports::TimeEntriesController < InternalApi::V1::ApplicationController
  include Timesheet

  def index
    authorize :report
    render :index, locals: { reports:, filter_options: }, status: :ok
  end

  def download
    authorize :report

    entries = reports.map { |e| e[:entries] }.flatten

    respond_to do |format|
      format.csv { send_data Reports::TimeEntries::GenerateCsv.new(entries).process }
      format.pdf { send_data Reports::TimeEntries::GeneratePdf.new(reports).process }
    end
  end

  private

    def filter_options
      @_filter_options ||= {
        clients: current_company.clients, team_members: current_company.users,
        currency: current_company.base_currency
      }
    end

    def reports
      @start_date = params[:start_date].to_date || DateTime.current.beginning_of_month
      @end_date = params[:end_date].to_date || DateTime.current.end_of_month
      selected_clients = current_company.clients
      selected_clients.filter_map do |client|
        {
          client_details: client,
          entries: client.timesheet_entries.during(@start_date, @end_date).includes(:project, :user)
        }
      end
    end

    def current_company_filter
      { project_id: current_company.project_ids }
    end

    def this_month_filter
      { work_date: DateTime.current.beginning_of_month..DateTime.current.end_of_month }
    end
end
