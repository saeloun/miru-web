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
    when :time_entries, :accounts_aging
      generate_pdf(report_type)
    else
      raise ArgumentError, "Unsupported report type: #{report_type}"
    end
  end

  private

    def generate_pdf(report_type)
      Pdf::HtmlGenerator.new(
        report_type,
        locals: { report_data:, current_company: }
      ).make
    end
end
