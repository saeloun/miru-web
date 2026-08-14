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

  describe "#perform" do
    let(:company) { create(:company) }
    let(:other_company) { create(:company) }
    let(:download_id) { "shared-download-id" }

    before do
      create(
        :bulk_invoice_download_status,
        company: other_company,
        download_id:,
        status: "completed",
        file_url: "https://example.com/other.zip"
      )
      allow(BulkInvoiceDownloadService).to receive(:new)
        .and_return(instance_double(BulkInvoiceDownloadService, process: "https://example.com/current.zip"))
    end

    it "keeps status records scoped to their company" do
      described_class.perform_now([], nil, download_id, "", { host: "example.com" }, company.id)

      expect(BulkInvoiceDownloadStatus.find_by!(company:, download_id:)).to have_attributes(
        status: "completed",
        file_url: "https://example.com/current.zip"
      )
      expect(BulkInvoiceDownloadStatus.find_by!(company: other_company, download_id:)).to have_attributes(
        status: "completed",
        file_url: "https://example.com/other.zip"
      )
    end
  end
end
