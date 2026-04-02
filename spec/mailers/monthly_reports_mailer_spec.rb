# frozen_string_literal: true

require "rails_helper"

RSpec.describe MonthlyReportsMailer, type: :mailer do
  describe "cash_flow_digest" do
    let(:company) { create(:company, name: "Saeloun Inc", base_currency: "USD") }
    let(:user) { create(:user, email: "vipul@saeloun.com", current_workspace: company, locale: "en") }
    let(:client) { create(:client, company:, name: "Haul Hub Inc") }
    let(:invoice) { create(:invoice, company:, client:, status: :paid, amount: 50_644.17, currency: "USD") }
    let!(:payment) do
      create(
        :payment,
        invoice:,
        amount: 50_644.17,
        base_currency_amount: 50_644.17,
        transaction_date: Date.new(2026, 3, 12),
        transaction_type: :bank_transfer,
        status: :paid
      )
    end
    let!(:expense) do
      create(
        :expense,
        company:,
        user:,
        amount: 8_250.50,
        category_name: "Payroll",
        vendor_name: "Saeloun Payroll",
        date: Date.new(2026, 3, 15),
        status: :paid,
        paid_at: Time.zone.local(2026, 3, 15, 12, 0, 0)
      )
    end

    let(:mail) do
      described_class.with(
        company_id: company.id,
        recipient_id: user.id,
        month: "2026-03-01"
      ).cash_flow_digest
    end

    it "renders the headers" do
      expect(mail.to).to eq([user.email])
      expect(mail.subject).to eq("Saeloun Inc's March cash flow digest")
    end

    it "renders the body" do
      expect(mail.body.encoded).to include("March cash flow digest")
      expect(mail.body.encoded).to include("Top money-in sources")
      expect(mail.body.encoded).to include("Haul Hub Inc")
      expect(mail.body.encoded).to include("Saeloun Payroll")
      expect(mail.body.encoded).to include("View reports in Miru")
    end
  end
end
