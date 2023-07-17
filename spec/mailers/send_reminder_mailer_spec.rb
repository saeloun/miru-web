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

    it "renders the headers" do
      expect(mail.subject).to eq(subject)
      expect(mail.to).to eq(recipients)
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("sent you an invoice")
    end
  end
end
