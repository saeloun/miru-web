  # frozen_string_literal: true

  class Reports::GeneratePdf
    attr_reader :report_data, :current_company, :report_type

    def initialize(report_type, report_data, current_company)
      @report_type = report_type
      @report_data = report_data
      @current_company = current_company
    end

    def process
      case report_type
      when :time_entries
        generate_time_entries_pdf
      when :accounts_aging
        generate_accounts_aging_pdf
      else
        raise ArgumentError, "Unsupported report type: #{report_type}"
      end
  end

    private

      def generate_time_entries_pdf
        Pdf::HtmlGenerator.new(
          :reports,
          locals: { report_data:, current_company: }
        ).make
      end

      def generate_accounts_aging_pdf
        Pdf::HtmlGenerator.new(
          :accounts_aging_reports,
          locals: { report_data:, current_company: }
        ).make
      end
  end
