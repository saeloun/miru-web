# frozen_string_literal: true

module StripeHelpers
  def stub_stripe_account_creation
    allow(Stripe::Account).to receive(:create).and_return(
      OpenStruct.new(id: "acct_test_#{SecureRandom.hex(8)}")
    )
  end

  def stub_stripe_account_retrieve(account_id = nil, details_submitted: false)
    account_id ||= "acct_test_#{SecureRandom.hex(8)}"
    allow(Stripe::Account).to receive(:retrieve).with(account_id).and_return(
      OpenStruct.new(
        id: account_id,
        details_submitted:,
        charges_enabled: true,
        payouts_enabled: true
      )
    )
  end

  def stub_stripe_account_link_creation
    allow(Stripe::AccountLink).to receive(:create).and_return(
      OpenStruct.new(url: "https://connect.stripe.com/test_link")
    )
  end
end

RSpec.configure do |config|
  config.include StripeHelpers

  # Automatically stub Stripe API calls in test environment
  config.before(:each) do
    # Stub Stripe API key check
    allow(Stripe).to receive(:api_key).and_return("sk_test_dummy_key")

    # Stub common Stripe operations
    stub_stripe_account_creation
    stub_stripe_account_retrieve
    stub_stripe_account_link_creation
  end
end
