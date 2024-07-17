# frozen_string_literal: true

require "benchmark/ips"
require_relative "../config/environment"

invoice_ids = Invoice.limit(10).pluck(:id)
company_logo = "saeloun_logo.png"
download_id = SecureRandom.uuid
root_url = "https://staging.miru.so/"
# current_url_options = { protocol: 'http', host: 'localhost', port: 3000 }

def set_cable_adapter(adapter)
  Rails.application.config.action_cable.adapter = adapter
  Rails.application.config.action_cable.cable({ adapter: })
  ActionCable.server.config.cable = Rails.application.config.action_cable.cable
end

Benchmark.ips do |x|
  # Test with Redis adapter
  set_cable_adapter("redis")
  x.report("BulkInvoiceDownloadJob with Redis") do
    BulkInvoiceDownloadJob.perform_now(
      invoice_ids,
      company_logo,
      download_id,
      root_url,
      # current_url_options
    )
  end

  # Test with SolidCable adapter
  set_cable_adapter("solid_cable")
  x.report("BulkInvoiceDownloadJob with SolidCable") do
    BulkInvoiceDownloadJob.perform_now(
      invoice_ids,
      company_logo,
      download_id,
      root_url,
      # current_url_options
    )
  end
end
