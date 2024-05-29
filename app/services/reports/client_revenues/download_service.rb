# frozen_string_literal: true

module Reports::ClientRevenues
  class DownloadService < Reports::DownloadService
    attr_reader :current_company, :reports

    def initialize(params, current_company)
      super
      @reports = []
    end

    private

      def fetch_complete_report
        @reports = Reports::ClientRevenues::IndexService.new(params, current_company).process
      end

      def generate_pdf
        Reports::GeneratePdf.new(:client_revenues, reports, current_company).process
      end

      def generate_csv
        csv_data = []
        headers = ["Client Name", "Overdue Amount", "Outstanding Amount", "Paid Amount", "Total Revenue"]

        reports[:clients].each do |client|
          csv_data << [
            client[:name],
            format_amount(client[:overdue_amount]),
            format_amount(client[:outstanding_amount]),
            format_amount(client[:paid_amount]),
            format_amount(client[:paid_amount] + client[:outstanding_amount] + client[:overdue_amount])
          ]
        end
        Reports::GenerateCsv.new(csv_data, headers).process
      end

      def format_amount(amount)
        FormatAmountService.new(reports[:base_currency], amount).process
      end
  end
end
