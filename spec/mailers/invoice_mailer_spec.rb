# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoiceMailer, type: :mailer do
  describe "invoice" do
    let(:company) { create :company }
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
      expect(mail.body.encoded).to include("Invoice ready to review")
      expect(mail.body.encoded).to include(invoice.invoice_number)
    end

    context "when the company has a logo" do
      let(:company) { create :company, :with_logo, name: "Saeloun Logo Co" }

      it "renders the organization logo instead of attaching Miru fallback logos" do
        body = mail.html_part.body.decoded

        expect(body).to include("/companies/#{company.id}/logo")
        expect(body).to include('alt="Saeloun Logo Co"')
        expect(mail.attachments["MiruLogoDarkWithText.png"]).to be_nil
        expect(mail.attachments["MiruLogoLightWithText.png"]).to be_nil
      end
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

  describe "send_invoice" do
    let(:company) { create :company }
    let(:client) { create :client, company: }
    let(:invoice) { create :invoice, client:, company: }
    let(:recipients) { [invoice.client.email] }
    let(:subject) { "Invoice #{invoice.invoice_number} from #{company.name}" }
    let(:mail) do
      InvoiceMailer.with(
        invoice:,
        recipients:,
        subject:,
        pdf_data: "%PDF-1.4 preview"
      ).send_invoice
    end

    it "uses the application mailer sender instead of a noreply fallback" do
      default_from = Mail::Address.new(ApplicationMailer.default[:from])
      expect(mail.from).to eq([default_from.address])
      expect(mail[:from].display_names).to include(default_from.display_name)
      expect(mail.from).not_to eq(["noreply@example.com"])
      expect(mail.subject).to eq(subject)
      expect(mail.to).to eq(recipients)
    end
  end
end
