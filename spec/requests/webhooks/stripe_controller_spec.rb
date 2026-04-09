# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Stripe webhooks", type: :request do
  include ActiveJob::TestHelper

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
      stripe_subscription_id: "sub_123",
      notify_plan_purchase: true
    )
  end

  it "enqueues a plan purchase alert when checkout upgrades a free workspace" do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("PLAN_PURCHASE_ALERT_EMAIL").and_return("vipul@saeloun.com")
    allow(ENV).to receive(:[]).with("APP_BASE_URL").and_return("https://app.miru.so")

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
    subscription = OpenStruct.new(
      id: "sub_123",
      customer: "cus_123",
      status: "active",
      current_period_end: Time.zone.local(2026, 4, 10, 12, 0, 0).to_i,
      items: OpenStruct.new(
        data: [
          OpenStruct.new(
            price: OpenStruct.new(
              recurring: OpenStruct.new(interval: "month")
            )
          )
        ]
      )
    )

    allow(Stripe::Webhook).to receive(:construct_event).and_return(event)
    allow(Stripe::Subscription).to receive(:retrieve).with("sub_123").and_return(subscription)

    expect do
      post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers
    end.to have_enqueued_mail(SubscriptionMailer, :plan_purchased)

    expect(response).to have_http_status(:ok)
    expect(company.reload.plan_tier).to eq("paid")
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
