# frozen_string_literal: true

require "rails_helper"

RSpec.describe BulkInvoiceDownloadJob, type: :job do
  describe "#perform_later" do
    it "enqueues the job" do
      expect {
        BulkInvoiceDownloadJob.perform_later([6], nil, "abc", "", { host: "example.com" })
      }.to enqueue_job
    end
  end
end
