# frozen_string_literal: true

require "rails_helper"
require "base64"
require "open3"
require "tempfile"

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
        logo_data = Base64.decode64("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2XQ9UAAAAASUVORK5CYII=")
        ActiveStorage::Blob.create_and_upload!(
          io: StringIO.new(logo_data),
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

        expect(response).to have_http_status(:not_found)
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
      it "keeps PDF exception content out of send and download responses and logs" do
        marker = "SYNTHETIC-PRIVATE-INVOICE-CONTENT"
        allow(InvoicePayment::PdfGeneration).to receive(:process).and_raise(StandardError, marker)
        allow(Rails.logger).to receive(:error).and_call_original

        post send_invoice_api_v1_invoice_path(invoice),
          params: { invoice_email: { recipients: ["client@example.test"] } }, headers: auth_headers(user)
        expect(response).to have_http_status(:internal_server_error)
        expect(json_response).to eq("error" => I18n.t("invoices_controller.send_invoice.pdf_failed"))

        get download_api_v1_invoice_path(invoice), headers: auth_headers(user)
        expect(response).to have_http_status(:internal_server_error)
        expect(json_response).to eq("error" => I18n.t("invoices_controller.download.pdf_failed"))

        expect(Rails.logger).to have_received(:error).with(
          "invoice_pdf_generation_failed invoice_id=#{invoice.id} company_id=#{company.id} error_class=StandardError"
        ).twice
        expect(Rails.logger).not_to have_received(:error).with(a_string_including(marker))
      end

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
      allow_any_instance_of(InvoicePayment::PdfGeneration).to receive(:process).and_call_original
    end

    it "decodes the default renderer stub into PDF bytes" do
      get "/api/v1/invoices/#{invoice.id}/download", headers: auth_headers(user)

      expect(response).to have_http_status(:success)
      expect(response.body).to eq("%PDF-1.4\nMocked PDF content")
    end

    [["unpaid", "0.00", nil, "1,575.00"], ["partially paid", "500.00", "500.00", "1,075.00"], ["paid", "1575.00", "1,575.00", "0.00"]].each do |state, paid, formatted_paid, due|
      it "downloads a parseable #{state} invoice PDF with the real template and INR balance" do
        allow(Ferrum::Browser).to receive(:new).and_call_original
        company.update!(base_currency: "INR")
        invoice.update!(currency: "INR", issue_date: Date.new(2026, 11, 1), due_date: Date.new(2026, 11, 30))
        if paid != "0.00"
          InvoicePayment::Settle.process({ invoice_id: invoice.id, amount: paid, transaction_date: Date.current, transaction_type: "bank_transfer", payment_currency: "INR" }, invoice)
        end

        get "/api/v1/invoices/#{invoice.id}/download", headers: auth_headers(user)

        expect(response).to have_http_status(:success)
        expect(response.content_type).to include("application/pdf")
        expect(response.body).to start_with("%PDF-")

        Tempfile.create(["invoice-download", ".pdf"], binmode: true) do |file|
          file.write(response.body)
          file.flush
          text, error, status = Open3.capture3("pdftotext", "-layout", file.path, "-")
          expect(status.success?).to be(true), error
          expect(text).to include(invoice.invoice_number, company.name, client.name, "Web Development Services")
          expect(text).to match(/Sub total\s+₹1,500\.00/)
          expect(text).to match(/Discount\s+-₹75\.00/)
          expect(text).to match(/Tax\s+₹150\.00/)
          expect(text).to match(/Total Due\s+₹#{Regexp.escape(due)}/)
          if formatted_paid
            expect(text).to match(/Total\s+₹1,575\.00/)
            expect(text).to match(/Amount Paid\s+₹#{Regexp.escape(formatted_paid)}/)
          end
        end
        File.binwrite(Rails.root.join("tmp", "invoice-download-#{state.tr(' ', '-')}.pdf"), response.body) if ENV["SAVE_TEST_PDFS"]
      end
    end
  end
end
