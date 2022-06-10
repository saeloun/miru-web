# frozen_string_literal: true

module Report
  class GeneratePdf
    attr_reader :report_entries

    def initialize(report_entries)
      @report_entries = report_entries
    end

    def process
      controller = ActionController::Base.new
      html = controller.render_to_string(
        template: "reports/pdf",
        layout: "layouts/pdf",
        locals: { report_entries: }
      )

      options = {
        wait_until: ["networkidle0", "load", "domcontentloaded", "networkidle2"]
      }
      Grover.new(html, options).to_pdf
    end
  end
end
