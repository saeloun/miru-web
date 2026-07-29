# frozen_string_literal: true

class Reports::TimeEntries::DownloadService < Reports::DownloadService
  MAX_ENTRIES = 5_000

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
        raise ArgumentError, "Time entry exports are limited to #{MAX_ENTRIES} entries" if report_entry_count > MAX_ENTRIES

        next_page = reports_data[:pagination_details][:next]
      end
    end

    def report_entry_count
      reports.sum { |report| Array(report[:entries]).size }
    end

    def generate_pdf
      Reports::GeneratePdf.new(:time_entries, reports, current_company).process
    end

    def generate_csv
      data = []
      headers = ["Project", "Client", "Note", "Team Member", "Date", "Hours Logged"]
      flatten_reports = reports.pluck(:entries).flatten
      flatten_reports.each do |entry|
          data << [
          "#{entry.project_name}",
          "#{entry.client_name}",
          "#{entry.note}",
          "#{entry.user_name}",
          "#{format_date(entry.work_date)}",
          "#{DurationFormatter.new(entry.duration).process}"
        ]
        end
      Reports::GenerateCsv.new(data, headers).process
    end

    def format_date(date)
      CompanyDateFormattingService.new(date, company: current_company, es_date_presence: true).process
    end
end
