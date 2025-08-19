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

    it "renders the headers" do
      expect(mail.subject).to eq(subject)
      expect(mail.to).to eq(recipients)
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("sent you an invoice")
    end

    context "with notification preferences" do
      let(:admin_user) { create(:user, current_workspace_id: company.id) }

      before { admin_user.add_role(:admin, company) }

      context "when invoice notifications are enabled" do
        let!(:notification_preference) do
          create(:notification_preference,
            user: admin_user,
            company:,
            invoice_email_notifications: true,
            unsubscribed_from_all: false
          )
        end

        it "should send invoice emails" do
          expect(mail.to).to include(invoice.client.email)
          expect(mail.subject).to include("Invoice")
        end
      end

      context "when invoice notifications are disabled" do
        let!(:notification_preference) do
          create(:notification_preference,
            user: admin_user,
            company:,
            invoice_email_notifications: false,
            unsubscribed_from_all: false
          )
        end

        it "documents that filtering should happen at service level" do
          # The mailer itself doesn't check preferences
          # The service calling the mailer should check: notification_preference.invoice_email_notifications
          expect(mail.to).to eq(recipients)
        end
      end

      context "when user is unsubscribed from all" do
        let!(:notification_preference) do
          create(:notification_preference,
            user: admin_user,
            company:,
            invoice_email_notifications: true,
            unsubscribed_from_all: true
          )
        end

        it "documents that unsubscribed users should not receive internal notifications" do
          # Client should still receive the invoice
          # Internal notifications should be filtered by the service
          expect(mail.to).to include(invoice.client.email)
          # The service should check: notification_preference.unsubscribed_from_all
        end
      end
    end
  end
end
