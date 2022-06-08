# frozen_string_literal: true

module Report
  class GeneratePdf
    attr_reader :entries

    def initialize(entries)
      @entries = entries
    end

    def process
      controller = ActionController::Base.new
      html = controller.render_to_string(
        template: "reports/pdf",
        layout: "layouts/pdf",
        locals: { entries: }
      )

      options = {
        wait_until: ["networkidle0", "load", "domcontentloaded", "networkidle2"]
      }
      Grover.new(html, options).to_pdf
    end
  end
end
