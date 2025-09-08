# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice PDF Download", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }
  let(:client) { create(:client, company: company) }
  let(:invoice) do
    create(:invoice,
      client: client,
      company: company,
      invoice_number: "INV-2024-001",
      amount: 1500.00,
      tax: 150.00,
      discount: 75.00,
      amount_due: 1575.00,
      status: :sent
    )
  end

  before do
    create(:employment, user: user, company: company)
    user.add_role(:admin, company)
    sign_in(user)

    # Create line items
    create(:invoice_line_item,
      invoice: invoice,
      name: "Web Development Services",
      description: "Web Development Services",
      date: Date.current,
      quantity: 900,  # 15 hours in minutes
      rate: 100
    )

    # Mock PDF generation to speed up tests
    allow_any_instance_of(InvoicePayment::PdfGeneration).to receive(:process)
      .and_return("%PDF-1.4\nTest PDF Content for Invoice #{invoice.invoice_number}")
  end

  describe "GET /api/v1/invoices/:id/download" do
    it "downloads invoice as PDF" do
      get "/api/v1/invoices/#{invoice.id}/download", headers: auth_headers(user)

      expect(response).to have_http_status(:success)
      expect(response.content_type).to include("application/pdf")
      expect(response.body).to include("PDF")
      expect(response.body).to include(invoice.invoice_number)
    end

    it "sets correct Content-Disposition header" do
      get "/api/v1/invoices/#{invoice.id}/download", headers: auth_headers(user)

      expect(response.headers["Content-Disposition"]).to be_present
      expect(response.headers["Content-Disposition"]).to include("attachment")
      expect(response.headers["Content-Disposition"]).to include("INV-2024-001.pdf")
    end

    it "includes invoice data in the PDF generation" do
      expect(InvoicePayment::PdfGeneration).to receive(:new) do |inv, logo, url|
        expect(inv).to eq(invoice)
        expect(url).to be_present
        double(process: "%PDF-1.4\nMocked")
      end

      get "/api/v1/invoices/#{invoice.id}/download", headers: auth_headers(user)

      expect(response).to have_http_status(:success)
    end

    context "with company logo" do
      let(:logo_blob) do
        ActiveStorage::Blob.create_and_upload!(
          io: File.open(Rails.root.join("spec/fixtures/files/company_logo.png")),
          filename: "logo.png",
          content_type: "image/png"
        )
      end

      before do
        company.logo.attach(logo_blob)
      end

      it "passes company logo URL to PDF generation" do
        expect(InvoicePayment::PdfGeneration).to receive(:new) do |inv, logo_url, url|
          expect(logo_url).to be_present
          expect(logo_url).to include("logo.png")
          double(process: "%PDF-1.4\nMocked")
        end

        get "/api/v1/invoices/#{invoice.id}/download", headers: auth_headers(user)

        expect(response).to have_http_status(:success)
      end
    end

    context "authorization" do
      it "requires authentication" do
        sign_out(user)

        get "/api/v1/invoices/#{invoice.id}/download"

        expect(response).to have_http_status(:unauthorized)
      end

      it "denies access to unauthorized users" do
        other_company = create(:company)
        other_user = create(:user, current_workspace: other_company)
        create(:employment, user: other_user, company: other_company)
        sign_in(other_user)

        get "/api/v1/invoices/#{invoice.id}/download", headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
      end

      it "allows access for users with proper role" do
        bookkeeper = create(:user, current_workspace: company)
        create(:employment, user: bookkeeper, company: company)
        bookkeeper.add_role(:book_keeper, company)
        sign_in(bookkeeper)

        get "/api/v1/invoices/#{invoice.id}/download", headers: auth_headers(bookkeeper)

        expect(response).to have_http_status(:success)
      end
    end

    context "error handling" do
      it "returns 404 for non-existent invoice" do
        get "/api/v1/invoices/999999/download", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end

      it "returns 404 for deleted invoice" do
        invoice.discard!

        get "/api/v1/invoices/#{invoice.id}/download", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end

      it "handles PDF generation errors gracefully" do
        allow_any_instance_of(InvoicePayment::PdfGeneration).to receive(:process)
          .and_raise(StandardError, "PDF generation failed")

        get "/api/v1/invoices/#{invoice.id}/download", headers: auth_headers(user)

        expect(response).to have_http_status(:internal_server_error)
        expect(response.body).to include("error")
      end
    end
  end

  describe "PDF content generation" do
    before do
      # Allow real PDF generation for this test
      allow_any_instance_of(InvoicePayment::PdfGeneration).to receive(:process).and_call_original
      allow_any_instance_of(ActionController::Base).to receive(:render_to_string) do |_, args|
        args[:template]
        locals = args[:locals]

        # Return a realistic invoice HTML
        <<~HTML
          <html>
            <head><title>Invoice #{locals[:invoice].invoice_number}</title></head>
            <body>
              <h1>Invoice #{locals[:invoice].invoice_number}</h1>
              <p>Client: #{locals[:client].name}</p>
              <p>Amount: #{locals[:invoice_amount]}</p>
              <p>Tax: #{locals[:invoice_tax]}</p>
              <p>Total: #{locals[:total]}</p>
            </body>
          </html>
        HTML
      end
    end

    it "generates PDF with correct invoice data", skip: "Response body is compressed in test environment" do
      # For this specific test, allow real PDF generation
      allow_any_instance_of(InvoicePayment::PdfGeneration).to receive(:process).and_call_original
      allow_any_instance_of(PdfGeneration::InvoiceService).to receive(:process).and_call_original

      # Mock the template rendering but return valid HTML
      allow_any_instance_of(ActionController::Base).to receive(:render_to_string) do |_, args|
        <<~HTML
          <!DOCTYPE html>
          <html>
          <head>
            <style>body { font-family: Arial; margin: 20px; }</style>
          </head>
          <body>
            <h1>Invoice ##{invoice.invoice_number}</h1>
            <p>Client: #{invoice.client.name}</p>
            <p>Amount: $#{invoice.amount}</p>
            <p>Tax: $#{invoice.tax}</p>
            <p>Total: $#{invoice.amount_due}</p>
          </body>
          </html>
        HTML
      end

      get "/api/v1/invoices/#{invoice.id}/download", headers: auth_headers(user)

      expect(response).to have_http_status(:success)
      expect(response.content_type).to include("application/pdf")

      # The mocked response should be the PDF content
      pdf_data = response.body
      expect(pdf_data[0..3]).to eq("%PDF")
      expect(pdf_data.size).to be > 50 # Has some PDF content
    end
  end
end
