# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::PaypalAmount do
  it "formats two-decimal currencies as strings" do
    expect(described_class.format(BigDecimal("1234.5"), "USD")).to eq("1234.50")
  end

  it "formats whole zero-decimal amounts without decimals" do
    expect(described_class.format(BigDecimal("1234"), "JPY")).to eq("1234")
    expect(described_class.format(BigDecimal("1234.00"), "TWD")).to eq("1234")
  end

  it "refuses a fractional amount in a zero-decimal currency rather than rounding the payer up or down" do
    expect { described_class.format(BigDecimal("1234.44"), "JPY") }
      .to raise_error(described_class::UnsupportedAmountError, /no decimals/)
    expect { described_class.format(BigDecimal("1234.01"), "HUF") }
      .to raise_error(described_class::UnsupportedAmountError)
  end

  it "parses PayPal amounts to BigDecimal" do
    expect(described_class.parse("10.25")).to eq(BigDecimal("10.25"))
  end
end
