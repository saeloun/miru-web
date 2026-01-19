# frozen_string_literal: true

require "rails_helper"
require "zip"

RSpec.describe BulkInvoiceDownloadService do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client) { create(:client, company:, name: "bob") }
  let!(:invoice1) { create(:invoice, client:, company:) }
  let!(:invoice2) { create(:invoice, client:, company:) }
  let(:invoice3) { create(:invoice, client:, company:) }

  describe "#process" do
    before do
      # While running specs, we don't want url and to access url, we need to set ActiveStorage url
      allow_any_instance_of(ActiveStorage::Blob).to receive(:url).and_return("")
      # Mock PDF generation to avoid Chrome browser dependency
      pdf_service = instance_double(PdfGeneration::InvoiceService, process: "%PDF-1.4 mock pdf content")
      allow(PdfGeneration::InvoiceService).to receive(:new).and_return(pdf_service)

      described_class.new([invoice1.id, invoice2.id], nil, "").process

      @added_pdf_files = []
      # Service
      Zip::File.open(ActiveStorage::Blob.service.path_for(ActiveStorage::Blob.last.key)) do |zipfile|
        zipfile.each do |entry|
          @added_pdf_files.push(entry.name)
        end
      end
    end

    it "checks if requested invoice pdfs are added to the zipfile stored against created blob" do
      expect(@added_pdf_files).to eq(["#{invoice1.invoice_number}.pdf", "#{invoice2.invoice_number}.pdf"])
    end
  end
end
