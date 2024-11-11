# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentMailer, type: :mailer do
  describe "payment" do
    let(:company) { create :company, :with_logo }
    let(:client) { create :client, company: }
    let(:invoice) { create :invoice, client: }
    let!(:user) { create(:user, current_workspace_id: company.id, companies: [company]) }
    let!(:email_rate_limiter) { create(:email_rate_limiter, user_id: user.id) }
    let(:subject) { "Payment details by #{invoice.client.name}" }
    let(:mail) { PaymentMailer.with(invoice_id: invoice.id, subject:, current_user_id: user.id).payment }

    it "renders the headers" do
      user.add_role :admin, company
      expect(mail.subject).to eq(subject)
      expect(mail.to).to eq([user.email])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("sent you an invoice")
    end

    it "check if email_rate_limiter is updated" do
      user.add_role :admin, company
      mail.deliver_now
      email_rate_limiter.reload
      expect(email_rate_limiter.number_of_emails_sent).to eq(1)
    end
  end
end
