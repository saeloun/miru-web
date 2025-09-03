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
      # Use the new PdfGeneration::InvoiceService
      pdf_data = ::PdfGeneration::InvoiceService.new(
        @invoice,
        @company_logo,
        @root_url
      ).process

      # If filepath is specified, save to file
      if @filepath
        File.open(@filepath, "wb") { |f| f.write(pdf_data) }
      end

      pdf_data
    end
  end
end
