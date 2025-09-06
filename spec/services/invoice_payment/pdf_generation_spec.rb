# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::PdfGeneration do
  let(:company) { create(:company) }
  let(:client) { create(:client, company: company) }
  let(:invoice) { create(:invoice, client: client, company: company) }
  let(:logo_url) { "https://example.com/logo.png" }
  let(:root_url) { "https://app.example.com" }
  let(:filepath) { Rails.root.join("tmp", "test_invoice.pdf") }

  before do
    # Mock the PdfGeneration::InvoiceService
    allow_any_instance_of(PdfGeneration::InvoiceService).to receive(:process)
      .and_return("%PDF-1.4\nMocked PDF Content")
  end

  after do
    # Clean up test files
    File.delete(filepath) if File.exist?(filepath)
  end

  describe "#process" do
    it "generates PDF data using PdfGeneration::InvoiceService" do
      service = described_class.new(invoice, logo_url, root_url)

      expect(PdfGeneration::InvoiceService).to receive(:new)
        .with(invoice, logo_url, root_url)
        .and_call_original

      pdf_data = service.process

      expect(pdf_data).to be_present
      expect(pdf_data).to include("PDF")
    end

    it "returns PDF data when no filepath is provided" do
      service = described_class.new(invoice, logo_url, root_url)
      pdf_data = service.process

      expect(pdf_data).to be_a(String)
      expect(pdf_data).to include("PDF")
      expect(File.exist?(filepath)).to eq(false)
    end

    it "saves PDF to file when filepath is provided" do
      service = described_class.new(invoice, logo_url, root_url, filepath)
      pdf_data = service.process

      expect(File.exist?(filepath)).to eq(true)
      expect(File.read(filepath)).to eq(pdf_data)
    end

    it "handles nil logo URL" do
      service = described_class.new(invoice, nil, root_url)

      expect(PdfGeneration::InvoiceService).to receive(:new)
        .with(invoice, nil, root_url)
        .and_call_original

      pdf_data = service.process
      expect(pdf_data).to be_present
    end

    it "handles nil root URL" do
      service = described_class.new(invoice, logo_url, nil)

      expect(PdfGeneration::InvoiceService).to receive(:new)
        .with(invoice, logo_url, nil)
        .and_call_original

      pdf_data = service.process
      expect(pdf_data).to be_present
    end

    it "creates parent directories if they don't exist" do
      nested_path = Rails.root.join("tmp", "test_dir", "nested", "invoice.pdf")

      service = described_class.new(invoice, logo_url, root_url, nested_path)
      service.process

      expect(File.exist?(nested_path)).to eq(true)

      # Clean up
      FileUtils.rm_rf(Rails.root.join("tmp", "test_dir"))
    end

    context "with real PDF generation" do
      before do
        # Allow real PDF generation for integration testing
        allow_any_instance_of(PdfGeneration::InvoiceService).to receive(:process).and_call_original
        allow_any_instance_of(ActionController::Base).to receive(:render_to_string)
          .and_return("<html><body><h1>Invoice ##{invoice.invoice_number}</h1></body></html>")
      end

      it "generates a valid PDF file", :slow do
        skip "Skipping slow test - requires real browser" if ENV["SKIP_SLOW_TESTS"]

        service = described_class.new(invoice, logo_url, root_url)
        pdf_data = service.process

        # Check PDF magic bytes
        expect(pdf_data[0..3]).to eq("%PDF")
        expect(pdf_data.size).to be > 100 # Should have substantial content
      end
    end
  end

  describe "error handling" do
    it "propagates errors from PdfGeneration::InvoiceService" do
      allow_any_instance_of(PdfGeneration::InvoiceService).to receive(:process)
        .and_raise(StandardError, "PDF generation failed")

      service = described_class.new(invoice, logo_url, root_url)

      expect { service.process }.to raise_error(StandardError, "PDF generation failed")
    end

    it "handles file system errors when saving" do
      # Use a read-only directory
      readonly_path = "/dev/null/invoice.pdf"

      service = described_class.new(invoice, logo_url, root_url, readonly_path)

      expect { service.process }.to raise_error(Errno::EEXIST)
    end
  end
end
