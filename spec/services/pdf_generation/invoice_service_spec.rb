# frozen_string_literal: true

require "rails_helper"

RSpec.describe PdfGeneration::InvoiceService do
  let(:company) do
    create(
      :company,
      bank_name: "First Bank",
      bank_account_number: "123456789",
      bank_routing_number: "987654321",
      bank_swift_code: "FSTBUS33",
      tax_id: "TAX-123",
      vat_number: "VAT-456",
      gst_number: "GST-789",
      ein: "12-3456789",
      us_taxpayer_id: "987-65-4321"
    )
  end
  let(:client) { create(:client, company: company, ein: "98-7654321") }
  let(:invoice) do
    create(:invoice,
      client: client,
      company: company,
      amount: 1000.00,
      tax: 100.00,
      discount: 50.00,
      amount_due: 1050.00,
      amount_paid: 0.00,
      currency: "USD"
    )
  end
  let(:logo_url) { "https://example.com/logo.png" }
  let(:root_url) { "https://app.example.com" }
  let(:service) { described_class.new(invoice.reload, logo_url, root_url) }
  let!(:primary_line_item) do
    create(:invoice_line_item,
      invoice: invoice,
      timesheet_entry: nil,
      name: "Consulting Services",
      description: "Consulting Services",
      date: Date.current,
      quantity: 600,
      rate: 100)
  end

  before do
    allow_any_instance_of(ActionController::Base).to receive(:render_to_string)
      .and_return("<html><body><h1>Invoice</h1></body></html>")
  end

  describe "#process" do
    it "generates a PDF for an invoice" do
      pdf_data = service.process

      expect(pdf_data).not_to be_nil
      expect(pdf_data.bytesize).to be > 0
      expect(pdf_data[0..3]).to eq("%PDF")
    end

    it "works without a company logo" do
      service = described_class.new(invoice.reload, nil, root_url)
      pdf_data = service.process

      expect(pdf_data).not_to be_nil
      expect(pdf_data.bytesize).to be > 0
    end

    it "works without a root URL" do
      service = described_class.new(invoice.reload, logo_url, nil)
      pdf_data = service.process

      expect(pdf_data).not_to be_nil
      expect(pdf_data.bytesize).to be > 0
    end

    it "passes correct locals to the template" do
      expect_any_instance_of(ActionController::Base).to receive(:render_to_string) do |_, args|
        locals = args[:locals]

        expect(locals[:invoice]).to eq(invoice)
        expect(locals[:client]).to eq(client)
        expect(locals[:company_logo]).to eq(logo_url)
        expect(locals[:invoice].company.bank_name).to eq("First Bank")
        expect(locals[:invoice].company.tax_id).to eq("TAX-123")
        expect(locals[:invoice].company.ein).to eq("12-3456789")
        expect(locals[:invoice].company.us_taxpayer_id).to eq("987-65-4321")
        expect(locals[:client].ein).to eq("98-7654321")
        expect(locals[:invoice_amount]).to be_present
        expect(locals[:invoice_tax]).to be_present
        expect(locals[:invoice_discount]).to be_present
        expect(locals[:invoice_amount_due]).to be_present
        expect(locals[:invoice_amount_paid]).to be_present
        expect(locals[:invoice_line_items]).to be_present
        expect(locals[:sub_total]).to be_present
        expect(locals[:total]).to be_present

        "<html><body>Invoice</body></html>"
      end

      service.process
    end

    it "calculates the correct subtotal" do
      subtotal = service.send(:calculate_subtotal)

      expect(subtotal).to eq(1000.0)
    end

    it "calculates the correct total" do
      total = service.send(:calculate_total)

      # total = subtotal + tax - discount = 1000 + 100 - 50 = 1050
      expect(total).to eq(1050.0)
    end

    it "formats currency correctly" do
      allow(FormatAmountService).to receive(:new).with("USD", anything).and_call_original

      service.process

      expect(FormatAmountService).to have_received(:new).with("USD", anything).at_least(:once)
    end

    it "uses invoice-specific PDF options" do
      options = service.send(:invoice_pdf_options)

      expect(options[:format]).to eq("A4")
      expect(options[:margin]).to eq({ top: 18, bottom: 18, left: 18, right: 18 })
      expect(options[:print_background]).to eq(true)
      expect(options[:prefer_css_page_size]).to eq(false)
    end
  end

  describe "line item processing" do
    it "processes all invoice line items" do
      create(:invoice_line_item,
        invoice: invoice,
        timesheet_entry: nil,
        name: "Development Services",
        description: "Development Services",
        date: Date.current,
        quantity: 300,
        rate: 200
      )

      line_items = described_class.new(invoice.reload, logo_url, root_url).send(:build_line_items)

      expect(line_items).to be_an(Array)
      expect(line_items.size).to eq(2)
    end

    it "uses the invoice currency for formatting line items" do
      invoice.update!(currency: "EUR")

      line_items = described_class.new(invoice.reload, logo_url, root_url).send(:build_line_items)

      expect(line_items).to be_an(Array)
      expect(line_items).not_to be_empty
    end
  end

  describe "signature resolution" do
    let(:signature_file) { Rails.root.join("spec", "support", "fixtures", "test-image.png") }

    context "when signature_enabled is true and company has signature attached" do
      before do
        client.update!(signature_enabled: true)
        company.invoice_signature.attach(
          io: File.open(signature_file),
          filename: "signature.png",
          content_type: "image/png"
        )
      end

      it "includes signature_url in the template locals" do
        expect_any_instance_of(ActionController::Base).to receive(:render_to_string) do |_, args|
          locals = args[:locals]
          expect(locals[:signature_url]).to be_present
          expect(locals[:signature_url]).to be_a(String)
          expect(locals[:signature_url]).to start_with(root_url)

          "<html><body>Invoice</body></html>"
        end

        service.process
      end
    end

    context "when signature_enabled is true but company has no signature attached" do
      before do
        client.update!(signature_enabled: true)
      end

      it "returns nil for signature_url in the template locals" do
        expect_any_instance_of(ActionController::Base).to receive(:render_to_string) do |_, args|
          locals = args[:locals]
          expect(locals[:signature_url]).to be_nil

          "<html><body>Invoice</body></html>"
        end

        service.process
      end
    end

    context "when signature_enabled is false and company has signature attached" do
      before do
        client.update!(signature_enabled: false)
        company.invoice_signature.attach(
          io: File.open(signature_file),
          filename: "signature.png",
          content_type: "image/png"
        )
      end

      it "returns nil for signature_url in the template locals" do
        expect_any_instance_of(ActionController::Base).to receive(:render_to_string) do |_, args|
          locals = args[:locals]
          expect(locals[:signature_url]).to be_nil

          "<html><body>Invoice</body></html>"
        end

        service.process
      end
    end

    context "when signature_enabled is false and company has no signature attached" do
      before do
        client.update!(signature_enabled: false)
      end

      it "returns nil for signature_url in the template locals" do
        expect_any_instance_of(ActionController::Base).to receive(:render_to_string) do |_, args|
          locals = args[:locals]
          expect(locals[:signature_url]).to be_nil

          "<html><body>Invoice</body></html>"
        end

        service.process
      end
    end
  end

  describe "error handling" do
    it "handles invoices without line items" do
      invoice.invoice_line_items.destroy_all

      expect { service.process }.not_to raise_error
    end

    it "handles invoices with nil amounts" do
      invoice.update_columns(tax: nil, discount: nil)

      expect { service.process }.not_to raise_error
    end

    it "renders company address metadata when business phone is blank" do
      allow_any_instance_of(ActionController::Base).to receive(:render_to_string).and_call_original
      company.update!(business_phone: nil)
      company.addresses.destroy_all
      address = create(
        :address,
        addressable: company,
        address_line_1: "123 Invoice Lane",
        address_line_2: "Suite 9",
        city: "Mumbai",
        state: "Maharashtra",
        pin: "400001",
        country: "IN"
      )

      rendered_service = described_class.new(invoice.reload, logo_url, root_url)

      expect(rendered_service.html_content).to include(address.formatted_address)
    end

    it "renders invoice PDF metadata with localized labels" do
      allow_any_instance_of(ActionController::Base).to receive(:render_to_string).and_call_original
      invoice.update!(reference: "PO-1234")

      I18n.backend.store_translations(:en, {
        pdfs: {
          invoices: {
            due_date: "Payment deadline",
            reference_label: "External reference",
            table: {
              amount: "Line amount"
            },
            payment_rows: {
              tax_id: "Company tax code",
              vat_number: "VAT code",
              gst_number: "GST code",
              ein: "Employer number",
              us_taxpayer_id: "US payer code"
            },
            thank_you: "Custom invoice footer",
            total_due: "Balance outstanding"
          }
        }
      })

      html = I18n.with_locale(:en) do
        described_class.new(invoice.reload, logo_url, root_url).html_content
      end

      expect(html).to include("Payment deadline:")
      expect(html).to include(invoice.formatted_due_date)
      expect(html).to include("External reference:")
      expect(html).to include("Company tax code: TAX-123")
      expect(html).to include("VAT code: VAT-456")
      expect(html).to include("GST code: GST-789")
      expect(html).to include("Employer number: 12-3456789")
      expect(html).to include("Employer number: 98-7654321")
      expect(html).to include("US payer code: 987-65-4321")
      expect(html).to include("Line amount")
      expect(html).to include("Balance outstanding")
      expect(html).to include("Custom invoice footer")
      expect(html).not_to include("Amount Due:</span>\n          <span class=\"invoice-meta-value\">#{invoice.formatted_due_date}")
    ensure
      I18n.reload!
    end

    it "omits company metadata when business phone and address are both blank" do
      allow_any_instance_of(ActionController::Base).to receive(:render_to_string).and_call_original
      company.update!(business_phone: nil)
      company.addresses.destroy_all

      rendered_service = described_class.new(invoice.reload, logo_url, root_url)

      expect(rendered_service.html_content).not_to include('<p class="invoice-company-meta">')
    end
  end
end
