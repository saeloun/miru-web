# frozen_string_literal: true

class InternalApi::V1::Reports::TimeEntriesController < InternalApi::V1::ApplicationController
  def index
    authorize :report
    render :index,
      locals: Reports::TimeEntries::ReportService.new(params, current_company, true).process,
      status: :ok
  end

  def download
    authorize :report

    reports = Reports::TimeEntries::ReportService.new(params, current_company).process[:reports]

    respond_to do |format|
      format.csv { send_data Reports::TimeEntries::GenerateCsv
        .new(reports.map { |e| e[:entries] }.flatten)
        .process
}
      format.pdf { send_data Reports::TimeEntries::GeneratePdf.new(reports).process }
    end
  end
end
