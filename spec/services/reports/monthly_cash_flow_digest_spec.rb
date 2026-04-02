# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::MonthlyCashFlowDigest do
  describe "#process" do
    let(:company) { create(:company, base_currency: "USD") }
    let(:client) { create(:client, company:, name: "Haul Hub Inc") }
    let(:invoice) { create(:invoice, company:, client:, status: :paid, amount: 1000, currency: "USD") }

    before do
      create(
        :payment,
        invoice:,
        amount: 900,
        base_currency_amount: 900,
        transaction_date: Date.new(2026, 3, 5),
        transaction_type: :bank_transfer,
        status: :paid
      )
      create(
        :payment,
        invoice:,
        amount: 300,
        base_currency_amount: 300,
        transaction_date: Date.new(2026, 2, 7),
        transaction_type: :ach,
        status: :paid
      )
      create(
        :expense,
        company:,
        amount: 250,
        category_name: "Software",
        vendor_name: "Linear",
        status: :paid,
        expense_type: :business,
        date: Date.new(2026, 3, 8),
        paid_at: Time.zone.local(2026, 3, 8, 9, 0, 0)
      )
      create(
        :expense,
        company:,
        amount: 125,
        category_name: "Travel",
        vendor_name: "Uber",
        status: :paid,
        expense_type: :business,
        date: Date.new(2026, 2, 10),
        paid_at: Time.zone.local(2026, 2, 10, 9, 0, 0)
      )
    end

    it "returns the monthly cash flow snapshot" do
      digest = described_class.new(company:, month: Date.new(2026, 3, 1)).process

      expect(digest[:month_label]).to eq("March")
      expect(digest[:money_in_total]).to eq(900.0)
      expect(digest[:previous_money_in_total]).to eq(300.0)
      expect(digest[:money_out_total]).to eq(250.0)
      expect(digest[:previous_money_out_total]).to eq(125.0)
      expect(digest[:net_change]).to eq(650.0)
      expect(digest[:top_money_in_sources].first).to include(name: "Haul Hub Inc", amount: 900.0)
      expect(digest[:top_money_out_sources].first).to include(name: "Linear", amount: 250.0)
      expect(digest[:trend_points].size).to eq(31)
    end
  end
end
