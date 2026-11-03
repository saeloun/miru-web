# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::Checkout do
  it "charges the remaining invoice currency amount without erasing a review added during checkout" do
    company = create(:company, base_currency: "USD")
    client = create(:client, company:, currency: "EUR", stripe_id: "cus_test")
    invoice = create(:invoice, company:, client:, currency: "EUR", amount: 123.45, amount_due: 23.45, amount_paid: 100)
    create(:stripe_connected_account, company:, account_id: "acct_test")
    checkout_session = OpenStruct.new(payment_intent: "pi_test")

    allow(Stripe::Checkout::Session).to receive(:create) do
      PaymentProviders::RazorpayPaymentReview.flag!(Invoice.find(invoice.id), payment_id: "pay_racing", payment_link_id: "plink_old",
        amount: 1000, currency: "EUR", reason: "untracked_link")
      checkout_session
    end

    described_class.process(
      invoice:,
      success_url: "https://example.test/success",
      cancel_url: "https://example.test/cancel"
    )

    expect(Stripe::Checkout::Session).to have_received(:create).with(
      hash_including(
        line_items: [
          hash_including(
            price_data: hash_including(currency: "eur", unit_amount: 2_345)
          )
        ]
      ),
      stripe_account: "acct_test"
    )
    expect(PaymentProviders::RazorpayPaymentReview.pending?(invoice.reload, "pay_racing")).to be(true)
  end
end
