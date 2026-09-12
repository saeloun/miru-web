# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::PaypalAmount do
  it "formats two-decimal currencies as strings" do
    expect(described_class.format(BigDecimal("1234.5"), "USD")).to eq("1234.50")
  end

  it "formats zero-decimal currencies without decimals" do
    expect(described_class.format(BigDecimal("1234.6"), "JPY")).to eq("1235")
  end

  it "rounds zero-decimal currencies up so the capture covers the invoice" do
    expect(described_class.format(BigDecimal("1234.44"), "JPY")).to eq("1235")
    expect(described_class.format(BigDecimal("1234.01"), "HUF")).to eq("1235")
    expect(described_class.format(BigDecimal("1234"), "TWD")).to eq("1234")
  end

  it "parses PayPal amounts to BigDecimal" do
    expect(described_class.parse("10.25")).to eq(BigDecimal("10.25"))
  end
end
