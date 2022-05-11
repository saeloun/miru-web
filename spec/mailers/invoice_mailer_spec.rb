# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoiceMailer, type: :mailer do
  describe "invoice" do
    let(:invoice) { create :invoice }
    let(:recipients) { [invoice.client.email, "miru@example.com"] }
    let(:subject) { "Invoice (#{invoice.invoice_number}) due on #{invoice.due_date}" }
    let(:mail) { InvoiceMailer.with(invoice:, subject:, recipients:).invoice }

    it "renders the headers" do
      expect(mail.subject).to eq(subject)
      expect(mail.to).to eq(recipients)
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("You have an invoice")
    end
  end
end
