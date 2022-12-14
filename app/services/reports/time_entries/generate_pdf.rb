# frozen_string_literal: true

module Reports::TimeEntries
  class GeneratePdf
    attr_reader :report_entries

    def initialize(report_entries)
      @report_entries = report_entries
    end

    def process
      Pdf::HtmlGenerator.new(
        "reports/pdf",
        locals: { report_entries: }
      ).process
    end
  end
end
