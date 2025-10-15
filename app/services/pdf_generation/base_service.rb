# frozen_string_literal: true

module PdfGeneration
  class BaseService < ApplicationService
    attr_reader :html_content, :options

    def initialize(html_content, options = {})
      @html_content = html_content
      @options = options
    end

    def process
      generate_pdf
    end

    private

      def generate_pdf
        FerrumPdf.render_pdf(html: html_content, pdf_options: options)
      end
  end
end
