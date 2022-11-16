# frozen_string_literal: true

class BulkInvoiceDownloadService
  include ZipUtilities
  require "zip"
  attr_reader :invoice_ids, :company_logo, :root_url

  def initialize(invoice_ids, company_logo, root_url)
    @invoice_ids = invoice_ids
    @company_logo = company_logo
    @root_url = root_url
  end

  def process
    get_zipped_invoices_data
  end

  private

    def get_zipped_invoices_data
      zip_file = Tempfile.new(uniq_zip_file_name)
      pdf_files = invoice_pdf_files
      add_files_to_zip(zip_file, pdf_files)
      zip_data = get_zip_file_data(zip_file)
      cleanup_files(pdf_files.values.push(zip_file))
      zip_data
    end

    def cleanup_files(files)
      files.each do |file|
        file.unlink
      end
    end

    def invoice_pdf_files
      invoice_ids.map do |invoice_id|
        invoice = get_invoice(invoice_id)
        [invoice.invoice_number + ".pdf", invoice_pdf_file(invoice)]
      end.to_h
    end

    def invoice_pdf_file(invoice)
      Tempfile.open do |file|
        invoice_pdf_content = InvoicePayment::PdfGeneration.process(invoice, company_logo, root_url)
        utf_8_encoded_content = invoice_pdf_content.encode("UTF-8", invalid: :replace, undef: :replace, replace: "?")
        file.write(utf_8_encoded_content)
        file.rewind
        file
      end
    end

    def get_invoice(id)
      Invoice.includes(:client, :invoice_line_items).find(id)
    end
end
