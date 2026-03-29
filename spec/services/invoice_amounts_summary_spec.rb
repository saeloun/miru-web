# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoiceAmountsSummary do
  describe ".process" do
    let(:company) { create(:company) }
    let(:client) { create(:client, company:) }
    let!(:draft_invoice) { create(:invoice, company:, client:, status: :draft, amount: 100.0, base_currency_amount: 0) }
    let!(:overdue_invoice) { create(:invoice, company:, client:, status: :overdue, amount: 200.0, base_currency_amount: 180.0) }
    let!(:sent_invoice) { create(:invoice, company:, client:, status: :sent, amount: 300.0, base_currency_amount: 0) }
    let!(:paid_invoice) { create(:invoice, company:, client:, status: :paid, amount: 400.0, base_currency_amount: 0) }

    it "returns rounded draft, overdue, and outstanding totals" do
      result = described_class.process(company.invoices)

      expect(result).to eq(
        draft_amount: 100.0,
        overdue_amount: 200.0,
        outstanding_amount: 500.0
      )
    end
  end
end
