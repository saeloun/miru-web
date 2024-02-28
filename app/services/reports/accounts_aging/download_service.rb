# frozen_string_literal: true

module Reports::AccountsAging
  class DownloadService < Reports::DownloadService
    attr_reader :current_company, :reports

    def initialize(params, current_company)
      super
      @reports = []
    end

    private

      def fetch_complete_report
        @reports = FetchOverdueAmount.new(current_company).process
      end

      def generate_pdf
        Reports::TimeEntries::GeneratePdf.new(:accounts_aging, reports, current_company).process
      end

      def generate_csv
        flatten_reports = reports.map { |e| e[:entries] }.flatten
        Reports::TimeEntries::GenerateCsv.new(flatten_reports, current_company).process
      end
  end
end
