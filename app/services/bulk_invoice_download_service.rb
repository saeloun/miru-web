# frozen_string_literal: true

class BulkInvoiceDownloadService
  require "zip"
  attr_reader :invoice_ids, :company_logo

  def initialize(invoice_ids, company_logo)
    @invoice_ids = invoice_ids
    @company_logo = company_logo
  end

  def process
    get_zipped_invoices_data
  end

  private

    def get_zipped_invoices_data
      zip_file = Tempfile.new(Time.now.to_i.to_s + "_" + SecureRandom.alphanumeric(10) + ".zip")
      # Zip::File::CREATE
      Zip::File.open(zip_file.path, create: true) do |zipfile|
        invoice_pdf_files.each do |invoice_no, invoice_pdf_file|
          zipfile.add(invoice_no + ".pdf", invoice_pdf_file.path)
          # invoice_pdf_file.unlink
        end
      end

      zip_data = File.read(zip_file.path)

      zip_file.close
      zip_file.unlink
      zip_data
    end

    def invoice_pdf_files
      invoice_ids.map do |invoice_id|
        invoice = get_invoice(invoice_id)
        [invoice.invoice_number, invoice_pdf_file(invoice)]
      end.to_h
    end

    def invoice_pdf_file(invoice)
      Tempfile.open do |file|
        invoice_pdf_content = InvoicePayment::PdfGeneration.process(invoice, company_logo)
        utf_8_encoded_content = invoice_pdf_content.encode("UTF-8", invalid: :replace, undef: :replace, replace: "?")
        file.write(utf_8_encoded_content)
        file.rewind
        file
      end
    end

    def get_invoice(id)
      @_invoice ||= Invoice.includes(:client, :invoice_line_items).find(id)
    end
end
