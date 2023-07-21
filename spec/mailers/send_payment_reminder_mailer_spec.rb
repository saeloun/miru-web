# frozen_string_literal: true

require "rails_helper"

RSpec.describe SendPaymentReminderMailer, type: :mailer do
  describe "send_payment_reminder" do
    let(:company) { create :company, :with_logo }
    let(:client) { create :client, company: }
    let(:invoice) { create :invoice, client:, company:, status: "overdue" }
    let(:recipients) { [invoice.client.email, "miru@example.com"] }
    let(:subject) { "Reminder to complete payments for unpaid invoices" }
    let(:message) {
      "This is a gentle reminder to complete payments for the following invoices. " \
      "You can find the respective payment links along with the invoice details given below"
    }
    let(:mail) {
      SendPaymentReminderMailer.with(selected_invoices: [invoice.id], subject:, recipients:).send_payment_reminder
    }

    it "renders the headers" do
      expect(mail.subject).to eq(subject)
      expect(mail.to).to eq(recipients)
    end
  end
end
