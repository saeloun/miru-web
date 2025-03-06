# frozen_string_literal: true

class BulkInvoiceDownloadJob < ApplicationJob
  queue_as :default

  def perform(invoice_ids, company_logo, download_id, root_url, current_url_options)
    ActiveStorage::Current.url_options = current_url_options

    # Create or update the status to 'processing'
    bulk_download_status = BulkInvoiceDownloadStatus.find_or_create_by(download_id:)
    bulk_download_status.update(status: "processing")

    begin
      file_url = BulkInvoiceDownloadService.new(invoice_ids, company_logo, root_url).process
      bulk_download_status.update(status: "completed", file_url:)
    rescue StandardError => e
      Rails.logger.error "Error in BulkInvoiceDownloadJob: #{e.message}"
      bulk_download_status.update(status: "failed")
      raise e
    end
  end
end
