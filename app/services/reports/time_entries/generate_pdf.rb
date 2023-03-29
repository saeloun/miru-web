# frozen_string_literal: true

module Reports::TimeEntries
  class GeneratePdf
    attr_reader :report_entries, :current_company

    def initialize(report_entries, current_company)
      @report_entries = report_entries
      @current_company = current_company
    end

    def process
      Pdf::HtmlGenerator.new(
        :reports,
        locals: { report_entries:, current_company: }
      ).make
    end
  end
end
