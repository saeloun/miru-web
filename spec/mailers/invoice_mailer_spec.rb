# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoiceMailer, type: :mailer do
  describe "invoice" do
    let(:company) { create :company, :with_logo }
    let(:user) { create(:user, :with_email_rate_limiter) }
    let(:client) { create :client, company: }
    let(:invoice) { create :invoice, client:, company:, status: :sending }
    let(:recipients) { [invoice.client.email, "miru@example.com"] }
    let(:subject) { "Invoice (#{invoice.invoice_number}) due on #{invoice.due_date}" }
    let(:mail) { InvoiceMailer.with(invoice_id: invoice.id, subject:, recipients:, current_user_id: user.id).invoice }

    it "renders the headers" do
      expect(mail.subject).to eq(subject)
      expect(mail.to).to eq(recipients)
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("sent you an invoice")
    end
  end
end
