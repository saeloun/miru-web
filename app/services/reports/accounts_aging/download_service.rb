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
        Reports::GeneratePdf.new(:accounts_aging, reports, current_company).process
      end

      def generate_csv
        csv_data = []
        headers = ["Client Name", "0-30 Days", "31-60 Days", "61-90 Days", "90+ Days", "Total"]
        reports[:clients].each do |client|
          csv_data << [
            client[:name],
            format_amount(client[:amount_overdue][:zero_to_thirty_days]),
            format_amount(client[:amount_overdue][:thirty_one_to_sixty_days]),
            format_amount(client[:amount_overdue][:sixty_one_to_ninety_days]),
            format_amount(client[:amount_overdue][:ninety_plus_days]),
            format_amount(client[:amount_overdue][:total])
        ]
        end

        csv_data << [
          "Total Amounts",
          reports[:total_amount_overdue_by_date_range][:zero_to_thirty_days],
          reports[:total_amount_overdue_by_date_range][:thirty_one_to_sixty_days],
          reports[:total_amount_overdue_by_date_range][:sixty_one_to_ninety_days],
          reports[:total_amount_overdue_by_date_range][:ninety_plus_days],
          reports[:total_amount_overdue_by_date_range][:total]
          ]

        Reports::GenerateCsv.new(csv_data, headers).process
      end

      def format_amount(amount)
        FormatAmountService.new(reports[:base_currency], amount).process
      end
  end
end
