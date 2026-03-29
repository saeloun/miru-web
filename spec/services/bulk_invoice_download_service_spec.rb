# frozen_string_literal: true

require "rails_helper"

RSpec.describe BulkInvoiceDownloadService do
  describe "#process" do
    let(:company) { create(:company) }
    let(:client) { create(:client, company:) }
    let!(:invoice) { create(:invoice, company:, client:) }
    let(:pdf_file) { instance_double(Tempfile) }
    let(:uploaded_file) { instance_double(FileUploader, url: "https://example.com/invoices.zip") }
    let(:zipper) { instance_double(Zipper, zip: true, temp_upload: uploaded_file, cleanup!: true) }

    before do
      allow_any_instance_of(Invoice).to receive(:temp_pdf).and_return(pdf_file)
      allow(Zipper).to receive(:new).and_return(zipper)
    end

    it "zips generated invoice pdfs, uploads the archive, and cleans up" do
      result = described_class.new([invoice.id], "logo.png", "http://localhost:3000").process

      expect(result).to eq("https://example.com/invoices.zip")
      expect(Zipper).to have_received(:new).with([{ name: "#{invoice.invoice_number}.pdf", file: pdf_file }])
      expect(zipper).to have_received(:zip)
      expect(zipper).to have_received(:temp_upload).with(1.hour)
      expect(zipper).to have_received(:cleanup!)
    end
  end
end
