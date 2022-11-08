# frozen_string_literal: true

require "rails_helper"
require "zip"

RSpec.describe BulkInvoiceDownloadService do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client) { create(:client, company:, name: "bob") }
  let!(:invoice1) { create(:invoice, client:) }
  let!(:invoice2) { create(:invoice, client:) }
  let(:invoice3) { create(:invoice, client:) }

  describe "#process" do
    before do
      zip_content = described_class.new([invoice1.id, invoice2.id], nil, "").process
      zip_file = Tempfile.open do |file|
                   file.write(zip_content)
                   file.rewind
                   file
                 end
      @added_pdf_files = []
      Zip::File.open(zip_file) do |zipfile|
        zipfile.each do |entry|
          @added_pdf_files.push(entry.name)
        end
      end
    end

    it "checks if requested invoice pdfs are added to the zip" do
      expect(@added_pdf_files).to eq(["#{invoice1.invoice_number}.pdf", "#{invoice2.invoice_number}.pdf"])
    end
  end
end
