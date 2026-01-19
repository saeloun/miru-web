# frozen_string_literal: true

require "rails_helper"

RSpec.describe SendReminderMailer, type: :mailer do
  describe "send_reminder" do
    let(:company) { create :company, :with_logo }
    let(:client) { create :client, company: }
    let(:invoice) { create :invoice, client:, company: }
    let(:recipients) { [invoice.client.email, "miru@example.com"] }
    let(:subject) { "Reminder to complete payments for unpaid invoice (#{invoice.invoice_number})" }
    let(:mail) { SendReminderMailer.with(invoice:, subject:, recipients:).send_reminder }

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
