# frozen_string_literal: true

class Api::V1::Reports::TimeEntriesController < Api::V1::ApplicationController
  def index
    authorize :report

    reports_data = Reports::TimeEntries::ReportService.new(params, current_company, get_filters: true).process
    render :index,
      locals: reports_data,
      status: 200
  end

  def download
    authorize :report

    data = Reports::TimeEntries::DownloadService.new(params, current_company).process
    
    if params[:format] == "pdf"
      send_data data, type: "application/pdf", disposition: "attachment", filename: "time_entries_report.pdf"
    else
      send_data data, type: "text/csv", disposition: "attachment", filename: "time_entries_report.csv"
    end
  end
end
