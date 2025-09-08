# frozen_string_literal: true

require "rails_helper"

RSpec.describe PdfGeneration::HtmlTemplateService do
  describe "#process" do
    let(:template) { "pdfs/test" }
    let(:layout) { "layouts/pdf" }
    let(:locals) { { title: "Test Document", content: "Test content" } }

    before do
      # Mock the template rendering
      allow_any_instance_of(ActionController::Base).to receive(:render_to_string)
        .and_return("<html><body><h1>Test Document</h1><p>Test content</p></body></html>")
    end

    it "renders a template to PDF" do
      service = described_class.new(template, layout: layout, locals: locals)
      pdf_data = service.process

      expect(pdf_data).not_to be_nil
      expect(pdf_data.bytesize).to be > 0
      expect(pdf_data[0..3]).to eq("%PDF")
    end

    it "processes URLs when root_url is provided" do
      html_with_relative_urls = '<html><body><img src="/images/logo.png"><a href="/home">Home</a></body></html>'
      allow_any_instance_of(ActionController::Base).to receive(:render_to_string)
        .and_return(html_with_relative_urls)

      service = described_class.new(template, root_url: "https://example.com")

      # Access the processed HTML through a test helper
      processed_html = service.send(:render_html_from_template)

      expect(processed_html).to include('src="https://example.com/images/logo.png"')
      expect(processed_html).to include('href="https://example.com/home"')
    end

    it "handles templates without layout" do
      service = described_class.new(template, layout: false, locals: locals)

      expect { service.process }.not_to raise_error
    end

    it "passes locals to the template" do
      expect_any_instance_of(ActionController::Base).to receive(:render_to_string)
        .with(hash_including(locals: locals))
        .and_return("<html><body>Test</body></html>")

      service = described_class.new(template, locals: locals)
      service.process
    end

    it "merges custom PDF options" do
      custom_options = {
        format: "A4",
        margin: { top: 20, bottom: 20 }
      }

      service = described_class.new(template, options: custom_options)
      pdf_data = service.process

      expect(pdf_data).not_to be_nil
      expect(pdf_data.bytesize).to be > 0
    end

    context "URL processing" do
      it "converts relative image URLs to absolute" do
        html = '<img src="/assets/logo.png">'
        service = described_class.new(template, root_url: "https://app.example.com")

        processed = service.send(:process_urls_in_html, html)
        expect(processed).to eq('<img src="https://app.example.com/assets/logo.png">')
      end

      it "converts relative link URLs to absolute" do
        html = '<a href="/invoices/123">View Invoice</a>'
        service = described_class.new(template, root_url: "https://app.example.com")

        processed = service.send(:process_urls_in_html, html)
        expect(processed).to eq('<a href="https://app.example.com/invoices/123">View Invoice</a>')
      end

      it "leaves absolute URLs unchanged" do
        html = '<img src="https://cdn.example.com/image.jpg">'
        service = described_class.new(template, root_url: "https://app.example.com")

        processed = service.send(:process_urls_in_html, html)
        expect(processed).to eq('<img src="https://cdn.example.com/image.jpg">')
      end

      it "handles multiple URLs in the same HTML" do
        html = '<img src="/logo.png"><link href="/style.css"><a href="/home">Home</a>'
        service = described_class.new(template, root_url: "https://example.com")

        processed = service.send(:process_urls_in_html, html)
        expect(processed).to include('src="https://example.com/logo.png"')
        expect(processed).to include('href="https://example.com/style.css"')
        expect(processed).to include('href="https://example.com/home"')
      end
    end
  end
end
