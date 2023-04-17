# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentMailer, type: :mailer do
  describe "payment" do
    let(:company) { create :company, :with_logo }
    let(:client) { create :client, company: }
    let(:invoice) { create :invoice, client: }
    let(:user) { create(:user, current_workspace_id: company.id, companies: [company]) }
    let(:subject) { "Payment details by #{invoice.client.name}" }
    let(:mail) { PaymentMailer.with(invoice:, subject:).payment }

    it "renders the headers" do
      user.add_role :admin, company
      expect(mail.subject).to eq(subject)
      expect(mail.to).to eq([user.email])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("sent you an invoice")
    end
  end
end
