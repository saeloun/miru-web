# frozen_string_literal: true

class Reports::TimeEntries::DownloadService < Reports::DownloadService
  attr_reader :reports

  def initialize(params, current_company)
    super
    @reports = []
  end

  private

    def fetch_complete_report
      next_page = 1

      until next_page == nil do
        reports_data = Reports::TimeEntries::ReportService.new(
          params.merge(page: next_page),
          current_company
          )
          .process
        @reports = reports + reports_data[:reports]
        next_page = reports_data[:pagination_details][:next]
      end
    end

    def generate_pdf
      Reports::TimeEntries::GeneratePdf.new(:time_entries, reports, current_company).process
    end

    def generate_csv
      flatten_reports = reports.map { |e| e[:entries] }.flatten
      Reports::TimeEntries::GenerateCsv.new(flatten_reports, current_company).process
    end
end
