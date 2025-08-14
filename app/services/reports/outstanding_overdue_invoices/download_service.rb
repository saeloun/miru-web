# frozen_string_literal: true

module Reports::OutstandingOverdueInvoices
  class DownloadService < Reports::DownloadService
    attr_reader :current_company, :reports

    def initialize(params, current_company)
      super
      @reports = fetch_complete_report
    end

    private

      def fetch_complete_report
        Reports::OutstandingOverdueInvoices::ReportDecorator.new(current_company).process
      end

      def generate_pdf
        Reports::GeneratePdf.new(:outstanding_overdue_invoices, reports, current_company).process
      end

      def generate_csv
        csv_data = []
        headers = ["Client Name", "Invoice No", "Issue Date", "Due Date", "Invoice Amount", "Invoice Status"]

        reports[:clients].each do |client|
          client[:invoices].each do |invoice|
            csv_data << [
              client[:name],
              invoice.invoice_number,
              format_date(invoice.issue_date),
              format_date(invoice.due_date),
              format_amount(invoice.amount),
              invoice.status
            ]
          end
        end
        Reports::GenerateCsv.new(csv_data, headers).process
      end

      def format_amount(amount)
        FormatAmountService.new(reports[:base_currency], amount).process
      end

      def format_date(date)
        CompanyDateFormattingService.new(date, company: current_company).process
      end
  end
end
