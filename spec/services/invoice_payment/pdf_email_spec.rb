# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice PDF Email Sending", type: :request do
  include ActiveJob::TestHelper
  let(:company) { create(:company, name: "Test Company") }
  let(:user) { create(:user, current_workspace: company) }
  let(:client) { create(:client, company: company, name: "Test Client", email: "client@example.com") }
  let(:invoice) do
    create(:invoice,
      client: client,
      company: company,
      invoice_number: "INV-2024-001",
      amount: 1500.00,
      status: :draft
    )
  end

  before do
    create(:employment, user: user, company: company)
    user.add_role(:admin, company)
    sign_in(user)

    # Mock PDF generation
    allow_any_instance_of(InvoicePayment::PdfGeneration).to receive(:process)
      .and_return("%PDF-1.4\nTest PDF Content")

    # Clear email deliveries
    ActionMailer::Base.deliveries.clear
  end

  describe "POST /api/v1/invoices/:id/send_invoice" do
    let(:email_params) do
      {
        invoice_email: {
          subject: "Invoice #{invoice.invoice_number} from #{company.name}",
          message: "Please find attached your invoice.",
          recipients: ["client@example.com", "accounting@example.com"]
        }
      }
    end

    it "sends invoice email with PDF attachment" do
      expect {
        perform_enqueued_jobs do
          post "/api/v1/invoices/#{invoice.id}/send_invoice",
               params: email_params,
               headers: auth_headers(user)
        end
      }.to change { ActionMailer::Base.deliveries.count }.by(1)

      expect(response).to have_http_status(:success)
    end

    it "updates invoice status to sent" do
      expect(invoice.status).to eq("draft")

      perform_enqueued_jobs do
        post "/api/v1/invoices/#{invoice.id}/send_invoice",
             params: email_params,
             headers: auth_headers(user)
      end

      invoice.reload
      expect(invoice.status).to eq("sent")
    end

    it "includes PDF attachment in email" do
      perform_enqueued_jobs do
        post "/api/v1/invoices/#{invoice.id}/send_invoice",
             params: email_params,
             headers: auth_headers(user)
      end

      email = ActionMailer::Base.deliveries.last
      expect(email.attachments).not_to be_empty

      pdf_attachment = email.attachments.find { |a| a.filename.end_with?(".pdf") }
      expect(pdf_attachment).to be_present
      expect(pdf_attachment.content_type).to include("application/pdf")
    end

    it "sends email to all specified recipients" do
      perform_enqueued_jobs do
        post "/api/v1/invoices/#{invoice.id}/send_invoice",
             params: email_params,
             headers: auth_headers(user)
      end

      email = ActionMailer::Base.deliveries.last
      expect(email.to).to include("client@example.com")
      expect(email.to).to include("accounting@example.com")
    end

    it "uses custom subject and message" do
      perform_enqueued_jobs do
        post "/api/v1/invoices/#{invoice.id}/send_invoice",
             params: email_params,
             headers: auth_headers(user)
      end

      email = ActionMailer::Base.deliveries.last
      expect(email).not_to be_nil
      expect(email.subject).to eq("Invoice INV-2024-001 from Test Company")
      # Check both HTML and text parts for the content
      email_body = email.body.to_s
      if email.multipart?
        email_body = email.parts.map(&:body).join(" ")
      end
      expect(email_body).to include("Please find attached your invoice")
    end

    it "includes company branding in email" do
      company.update!(name: "Awesome Company")
      ENV["DEFAULT_FROM_EMAIL"] = "info@awesome.com"

      perform_enqueued_jobs do
        post "/api/v1/invoices/#{invoice.id}/send_invoice",
             params: email_params,
             headers: auth_headers(user)
      end

      email = ActionMailer::Base.deliveries.last
      expect(email.from).to include("info@awesome.com")
    end

    context "error handling" do
      it "returns error when recipients are missing" do
        invalid_params = {
          invoice_email: {
            subject: "Invoice",
            message: "Please pay",
            recipients: []
          }
        }

        post "/api/v1/invoices/#{invoice.id}/send_invoice",
             params: invalid_params,
             headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(ActionMailer::Base.deliveries).to be_empty
      end

      it "handles PDF generation failure gracefully" do
        allow_any_instance_of(InvoicePayment::PdfGeneration).to receive(:process)
          .and_raise(StandardError, "PDF generation failed")

        post "/api/v1/invoices/#{invoice.id}/send_invoice",
             params: email_params,
             headers: auth_headers(user)

        expect(response).to have_http_status(:internal_server_error)
        expect(ActionMailer::Base.deliveries).to be_empty
      end

      it "doesn't send email if invoice is already paid" do
        invoice.update!(status: :paid)

        post "/api/v1/invoices/#{invoice.id}/send_invoice",
             params: email_params,
             headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(ActionMailer::Base.deliveries).to be_empty
      end
    end

    context "authorization" do
      it "requires authentication" do
        sign_out(user)

        post "/api/v1/invoices/#{invoice.id}/send_invoice",
             params: email_params

        expect(response).to have_http_status(:unauthorized)
      end

      it "denies access to unauthorized users" do
        other_company = create(:company)
        other_user = create(:user, current_workspace: other_company)
        create(:employment, user: other_user, company: other_company)
        sign_in(other_user)

        post "/api/v1/invoices/#{invoice.id}/send_invoice",
             params: email_params,
             headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "Invoice email tracking" do
    it "tracks when invoice email was sent" do
      expect(invoice.sent_at).to be_nil

      post "/api/v1/invoices/#{invoice.id}/send_invoice",
           params: {
             invoice_email: {
               subject: "Invoice",
               message: "Please pay",
               recipients: ["client@example.com"]
             }
           },
           headers: auth_headers(user)

      invoice.reload
      expect(invoice.sent_at).to be_present
      expect(invoice.sent_at).to be_within(1.minute).of(Time.current)
    end

    it "creates an audit log entry for sending invoice" do
      expect {
        post "/api/v1/invoices/#{invoice.id}/send_invoice",
             params: {
               invoice_email: {
                 subject: "Invoice",
                 message: "Please pay",
                 recipients: ["client@example.com"]
               }
             },
             headers: auth_headers(user)
      }.to change { invoice.audits.count }.by_at_least(1)

      audit = invoice.audits.last
      expect(audit.action).to include("update")
      expect(audit.audited_changes.keys).to include("status")
    end
  end
end
