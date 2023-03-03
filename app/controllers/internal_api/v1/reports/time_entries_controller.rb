# frozen_string_literal: true

class InternalApi::V1::Reports::TimeEntriesController < InternalApi::V1::ApplicationController
  def index
    authorize :report
    render :index,
      locals: Reports::TimeEntries::ReportService.new(params, current_company, get_filters: true).process,
      status: :ok
  end

  def download
    authorize :report

    send_data Reports::TimeEntries::DownloadService.new(params, current_company).process
  end
end
