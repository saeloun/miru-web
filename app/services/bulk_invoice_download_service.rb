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
      file_uploader = FileUploader.new(zipper.file, "Invoices_" + Time.now.to_i.to_s + ".zip")
      file_uploader.upload
      file_uploader.delete_after(1.hours)
      zipper.cleanup!
      file_uploader.url
    end

    def invoices_temp_pdf_data
      invoices.map do |invoice|
        { name: "#{invoice.invoice_number}.pdf", file: invoice.temp_pdf(company_logo, root_url) }
      end
    end
end
