# frozen_string_literal: true

class BulkInvoiceDownloadService
  attr_reader :invoices, :company_logo, :root_url

  def initialize(invoice_ids, company_logo, root_url)
    @invoices = Invoice.includes(:client, :invoice_line_items).where(id: invoice_ids)
    @company_logo = company_logo
    @root_url = root_url
  end

  def process
    zip_invoices
  end

  private

    def zip_invoices
      zipper = Zipper.new(invoices_temp_pdf_data)
      zipper.zip

      zip_data = zipper.read
      zipper.cleanup!

      zip_data
    end

    def invoices_temp_pdf_data
      invoices.map do |invoice|
        temp_pdf = invoice.temp_pdf
        { name: temp_pdf.name, file: temp_pdf.tempfile }
      end
    end
end
