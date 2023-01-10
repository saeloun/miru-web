# frozen_string_literal: true

class BulkInvoiceDownloadChannel < ApplicationCable::Channel
  def subscribed
    stream_from "bulk_invoice_download_channel_#{params[:download_id]}"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
