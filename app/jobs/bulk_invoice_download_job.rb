# frozen_string_literal: true

class BulkInvoiceDownloadJob < ApplicationJob
  queue_as :default

  def perform(invoice_ids, company_logo, download_id)
    zip_content = BulkInvoiceDownloadService.process(invoice_ids, company_logo)

    ActionCable.server.broadcast(
      "bulk_invoice_download_channel_#{download_id}",
      zip_file: {
        file_name: "Invoices-#{Time.now.utc.iso8601}.zip",
        content: zip_content
      }
    )
  end
end
