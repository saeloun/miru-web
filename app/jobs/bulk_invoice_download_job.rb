# frozen_string_literal: true

class BulkInvoiceDownloadJob < ApplicationJob
  queue_as :default

  def perform(invoice_ids, company_logo, download_id, root_url)
    zip_content = BulkInvoiceDownloadService.new(invoice_ids, company_logo, root_url).process
    ActionCable.server.broadcast(
      "bulk_invoice_download_channel_#{download_id}",
      {
        content: zip_content
      }
    )
  end
end
