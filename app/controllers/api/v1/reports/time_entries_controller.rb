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

    send_data Reports::TimeEntries::DownloadService.new(params, current_company).process
  end
end
