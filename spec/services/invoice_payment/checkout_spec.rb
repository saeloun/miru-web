# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::Checkout do
  it "charges the invoice amount in the invoice currency" do
    company = create(:company, base_currency: "USD")
    client = create(:client, company:, currency: "EUR", stripe_id: "cus_test")
    invoice = create(:invoice, company:, client:, currency: "EUR", amount: 123.45)
    create(:stripe_connected_account, company:, account_id: "acct_test")
    checkout_session = OpenStruct.new(payment_intent: "pi_test")

    allow(Stripe::Checkout::Session).to receive(:create).and_return(checkout_session)

    described_class.process(
      invoice:,
      success_url: "https://example.test/success",
      cancel_url: "https://example.test/cancel"
    )

    expect(Stripe::Checkout::Session).to have_received(:create).with(
      hash_including(
        line_items: [
          hash_including(
            price_data: hash_including(currency: "eur", unit_amount: 12_345)
          )
        ]
      ),
      stripe_account: "acct_test"
    )
  end
end
