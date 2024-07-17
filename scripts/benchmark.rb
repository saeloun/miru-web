# frozen_string_literal: true

require "benchmark/ips"
require_relative "../config/environment"

invoice_ids = Invoice.limit(10).pluck(:id)
company_logo = "saeloun_logo.png"
download_id = SecureRandom.uuid
root_url = "https://staging.miru.so/"
current_url_options = { protocol: "https", host: "staging.miru.so", port: 443 }

Benchmark.ips do |x|
  x.report("BulkInvoiceDownloadJob with Redis") do
    BulkInvoiceDownloadJob.perform_now(
      invoice_ids,
      company_logo,
      download_id,
      root_url,
      current_url_options
    )
  end
end
