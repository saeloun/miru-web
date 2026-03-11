# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Stripe webhooks", type: :request do
  let(:company) { create(:company, stripe_customer_id: "cus_123") }
  let(:headers) { { "HTTP_STRIPE_SIGNATURE" => "sig_test" } }

  it "syncs a subscription checkout completion for workspace billing" do
    event = OpenStruct.new(
      type: "checkout.session.completed",
      data: OpenStruct.new(
        object: OpenStruct.new(
          mode: "subscription",
          customer: "cus_123",
          subscription: "sub_123",
          metadata: OpenStruct.new(company_id: company.id)
        )
      )
    )

    allow(Stripe::Webhook).to receive(:construct_event).and_return(event)
    allow(Subscriptions::StripeSyncService).to receive(:process).and_return(true)

    post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers

    expect(response).to have_http_status(:ok)
    expect(Subscriptions::StripeSyncService).to have_received(:process).with(
      company:,
      stripe_customer_id: "cus_123",
      stripe_subscription_id: "sub_123"
    )
  end

  it "syncs subscription lifecycle updates" do
    subscription = OpenStruct.new(
      id: "sub_123",
      customer: "cus_123",
      status: "active"
    )
    event = OpenStruct.new(
      type: "customer.subscription.updated",
      data: OpenStruct.new(object: subscription)
    )

    allow(Stripe::Webhook).to receive(:construct_event).and_return(event)
    allow(Subscriptions::StripeSyncService).to receive(:process).and_return(true)

    post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers

    expect(response).to have_http_status(:ok)
    expect(Subscriptions::StripeSyncService).to have_received(:process).with(
      stripe_customer_id: "cus_123",
      stripe_subscription_id: "sub_123",
      subscription:
    )
  end
end
