# frozen_string_literal: true

require "rails_helper"

RSpec.describe UpdateExchangeRatesJob, type: :job do
  it "warms the cache for each active currency pair against every base currency" do
    company = create(:company, base_currency: "USD")
    client = create(:client, company:, currency: "EUR")
    create(:invoice, company:, client:, currency: "EUR", amount: 100, status: :sent)

    allow(CurrencyConversionService).to receive(:get_exchange_rate).and_return(1.1)

    described_class.perform_now

    expect(CurrencyConversionService).to have_received(:get_exchange_rate).with("EUR", "USD", Date.current)
  end

  it "skips pairs where the currency equals the base currency" do
    company = create(:company, base_currency: "USD")
    client = create(:client, company:, currency: "USD")
    create(:invoice, company:, client:, currency: "USD", amount: 100, status: :sent)

    allow(CurrencyConversionService).to receive(:get_exchange_rate).and_return(1.0)

    described_class.perform_now

    expect(CurrencyConversionService).not_to have_received(:get_exchange_rate).with("USD", "USD", anything)
  end
end
