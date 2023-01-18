# frozen_string_literal: true

class BulkInvoiceDownloadJob < ApplicationJob
  queue_as :default

  def perform(invoice_ids, company_logo, download_id, root_url, current_url_options)
    ActiveStorage::Current.url_options = current_url_options
    file_url = BulkInvoiceDownloadService.new(invoice_ids, company_logo, root_url).process
    ActionCable.server.broadcast(
      "bulk_invoice_download_channel_#{download_id}",
      {
        file_url:
      }
    )
  end
end
