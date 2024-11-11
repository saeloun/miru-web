# frozen_string_literal: true

require "rails_helper"

RSpec.describe ClientPaymentMailer, type: :mailer do
  describe "payment" do
    let(:company) { create :company, :with_logo }
    let(:client) { create :client, company: }
    let(:invoice) { create :invoice, client: }
    let!(:user) { create(:user, current_workspace_id: company.id, companies: [company]) }
    let!(:email_rate_limiter) { create(:email_rate_limiter, user:) }
    let(:subject) { "Payment Receipt of Invoice #{invoice.invoice_number} from #{invoice.company.name}" }
    let(:mail) { ClientPaymentMailer.with(invoice_id: invoice.id, subject:, current_user_id: user.id).payment }

    it "renders the headers" do
      user.add_role :admin, company
      expect(mail.subject).to eq(subject)
      expect(mail.to).to eq([client.email])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("Payment receipt")
    end

    it "check if email_rate_limiter is updated" do
      mail.deliver_now
      email_rate_limiter.reload
      expect(email_rate_limiter.number_of_emails_sent).to eq(1)
    end
  end
end
