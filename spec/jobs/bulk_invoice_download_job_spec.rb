# frozen_string_literal: true

require "rails_helper"

RSpec.describe BulkInvoiceDownloadJob, type: :job do
  describe "#perform_later" do
    it "enqueues the job" do
      ActiveJob::Base.queue_adapter = :test
      expect {
        BulkInvoiceDownloadJob.perform_later([6], nil, "abc", "")
      }.to enqueue_job
    end
  end

  describe "executed job" do
    before do
      allow_any_instance_of(BulkInvoiceDownloadService).to receive(:process).and_return("file_url")
    end

    it "broadcast the data on the expected channel" do
      expect {
        BulkInvoiceDownloadJob.perform_now([6], nil, "abc", "", { host: "localhost", port: 3000 })
      }.to have_broadcasted_to("bulk_invoice_download_channel_abc").with(file_url: "file_url")
    end
  end
end
