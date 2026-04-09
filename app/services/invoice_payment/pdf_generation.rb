# frozen_string_literal: true

module InvoicePayment
  class PdfGeneration < ApplicationService
    def initialize(invoice, company_logo, root_url, filepath = nil)
      @invoice = invoice
      @company_logo = company_logo
      @root_url = root_url
      @filepath = filepath
    end

    def process
      pdf_data = pdf_service.process

      persist_pdf(pdf_data) if @filepath

      pdf_data
    end

    private

      def pdf_service
        ::PdfGeneration::InvoiceService.new(
          @invoice,
          @company_logo,
          @root_url
        )
      end

      def persist_pdf(pdf_data)
        FileUtils.mkdir_p(File.dirname(@filepath))
        File.open(@filepath, "wb") { |file| file.write(pdf_data) }
      end
  end
end
