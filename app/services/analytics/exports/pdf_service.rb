# frozen_string_literal: true

module Analytics
  module Exports
    class PdfService < PdfGeneration::HtmlTemplateService
      def initialize(export_payload, current_company)
        super(
          "pdfs/analytics_export",
          layout: "pdf",
          locals: {
            export_payload:,
            current_company:
          },
          options: pdf_options
        )
      end

      private

        def pdf_options
          {
            format: :A4,
            margin: {
              top: 18,
              bottom: 18,
              left: 18,
              right: 18
            },
            print_background: true,
            prefer_css_page_size: false
          }
        end
    end
  end
end
