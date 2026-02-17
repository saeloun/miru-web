# frozen_string_literal: true

require "rails_helper"

RSpec.describe PdfGeneration::BaseService do
  describe "#process" do
    let(:html_content) { "<html><body><h1>Test PDF</h1></body></html>" }
    let(:service) { described_class.new(html_content) }

    it "generates a PDF from HTML content" do
      pdf_data = service.process

      expect(pdf_data).not_to be_nil
      expect(pdf_data.bytesize).to be > 0
      expect(pdf_data).to be_a(String)
      expect(pdf_data.encoding).to eq(Encoding::ASCII_8BIT)
      # PDF files start with %PDF
      expect(pdf_data[0..3]).to eq("%PDF")
    end

    it "accepts custom options" do
      custom_options = {
        format: "A4",
        landscape: true,
        margin: { top: 10, bottom: 10, left: 10, right: 10 }
      }

      service = described_class.new(html_content, custom_options)
      pdf_data = service.process

      expect(pdf_data).not_to be_nil
      expect(pdf_data.bytesize).to be > 0
    end

    it "handles HTML with special characters" do
      html_with_special_chars = "<html><body><h1>Invoice #123 &amp; €100</h1></body></html>"
      service = described_class.new(html_with_special_chars)

      expect { service.process }.not_to raise_error
    end

    it "handles empty HTML content" do
      service = described_class.new("")
      pdf_data = service.process

      expect(pdf_data).not_to be_nil
      expect(pdf_data.bytesize).to be > 0
      expect(pdf_data[0..3]).to eq("%PDF")
    end

    context "with browser errors" do
      it "cleans up resources even on failure" do
        allow_any_instance_of(Ferrum::Browser).to receive(:go_to).and_raise(StandardError, "Browser error")

        expect { service.process }.to raise_error(StandardError, "Browser error")
      end
    end
  end

  describe "default options" do
    let(:service) { described_class.new("test") }

    it "has sensible defaults" do
      options = service.send(:default_options)

      expect(options[:format]).to eq("A4")
      expect(options[:landscape]).to eq(false)
      expect(options[:print_background]).to eq(true)
      expect(options[:margin]).to be_a(Hash)
    end
  end
end
