# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoiceMailer, type: :mailer do
  describe "invoice" do
    let(:company) { create :company, :with_logo }
    let(:client) { create :client, company: }
    let(:invoice) { create :invoice, client:, company:, status: :sending }
    let(:recipients) { [invoice.client.email, "miru@example.com"] }
    let(:subject) { "Invoice (#{invoice.invoice_number}) due on #{invoice.due_date}" }
    let(:mail) { InvoiceMailer.with(invoice_id: invoice.id, subject:, recipients:).invoice }

    before do
      # Mock PDF generation to avoid Chrome browser dependency in mailer tests
      pdf_service = instance_double(PdfGeneration::InvoiceService, process: "%PDF-1.4 mock pdf content")
      allow(PdfGeneration::InvoiceService).to receive(:new).and_return(pdf_service)
    end

    it "renders the headers" do
      expect(mail.subject).to eq(subject)
      expect(mail.to).to eq(recipients)
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("sent you an invoice")
    end
  end
end
