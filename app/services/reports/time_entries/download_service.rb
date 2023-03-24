# frozen_string_literal: true

class Reports::TimeEntries::DownloadService
  attr_reader :params, :current_company, :reports

  def initialize(params, current_company)
    @params = params
    @current_company = current_company

    @reports = []
  end

  def process
    fetch_complete_report
    format_report
  end

  private

    def fetch_complete_report
      next_page = 1

      reports_data = Reports::TimeEntries::ReportService.new(
        params.merge(page: params[:page]),
        current_company
        )
        .process
      @reports = reports + reports_data[:reports]
      next_page = reports_data[:pagination_details][:next]
    end

    def format_report
      if params[:format] == "pdf"
        Reports::TimeEntries::GeneratePdf.new(reports, current_company).process
      else
        flatten_reports = reports.map { |e| e[:entries] }.flatten
        Reports::TimeEntries::GenerateCsv.new(flatten_reports, current_company).process
      end
    end
end
