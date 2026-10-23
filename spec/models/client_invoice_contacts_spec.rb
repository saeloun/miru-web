# frozen_string_literal: true

require "rails_helper"

RSpec.describe Client, "invoice contacts" do
  let(:company) { create(:company) }
  let(:client) { create(:client, company:, finance_email: "finance@example.test", signatory_email: "signer@example.test") }
  let(:contact) { create(:user, email: "contact@example.test") }

  before do
    create(:client_member, company:, client:, user: contact)
  end

  it "adds finance to existing contacts without treating the signatory as a recipient" do
    expect(client.send_invoice_emails(false)).to contain_exactly(contact.email, "finance@example.test")
  end

  it "preserves the virtual-verification switch" do
    create(:invitation, company:, client:, role: "client", recipient_email: "pending@example.test", virtual_verified: true, accepted_at: nil)

    expect(client.send_invoice_emails(false)).to contain_exactly(contact.email, "finance@example.test")
    expect(client.send_invoice_emails(true)).to contain_exactly(contact.email, "pending@example.test", "finance@example.test")
  end

  it "deduplicates a matching finance contact case-insensitively and preserves the old fallback" do
    client.update!(finance_email: contact.email.upcase)
    expect(client.send_invoice_emails(false)).to eq([contact.email])
    client.update!(finance_email: nil)
    expect(client.send_invoice_emails(false)).to eq([contact.email])
  end
end
