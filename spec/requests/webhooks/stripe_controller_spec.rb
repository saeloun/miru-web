# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Stripe webhooks", type: :request do
  it "rejects oversized webhook bodies before verification" do
    post "/webhooks/stripe/checkout/fulfillment",
      params: "x" * (Webhooks::StripeController::MAX_WEBHOOK_BODY_BYTES + 1),
      headers: { "CONTENT_TYPE" => "application/octet-stream" }

    expect(response).to have_http_status(:content_too_large)
  end

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
    allow(Subscriptions::StripeSyncService).to receive(:reconcile).and_return(true)

    post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers

    expect(response).to have_http_status(:ok)
    expect(Subscriptions::StripeSyncService).to have_received(:reconcile).with(
      company:,
      stripe_customer_id: "cus_123",
      stripe_subscription_id: "sub_123",
      notify_plan_purchase: true
    )
  end

  it "syncs a payment link checkout completion using the client reference" do
    event = Stripe::Event.construct_from(
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          customer: "cus_123",
          subscription: "sub_123",
          metadata: {},
          client_reference_id: company.id.to_s
        }
      }
    )

    allow(Stripe::Webhook).to receive(:construct_event).and_return(event)
    allow(Subscriptions::StripeSyncService).to receive(:reconcile).and_return(true)

    post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers

    expect(response).to have_http_status(:ok)
    expect(Subscriptions::StripeSyncService).to have_received(:reconcile).with(
      company:,
      stripe_customer_id: "cus_123",
      stripe_subscription_id: "sub_123",
      notify_plan_purchase: true
    )
  end

  it "rejects a checkout that references a company linked to a different customer" do
    company.update!(stripe_customer_id: "cus_existing")

    event = Stripe::Event.construct_from(
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          customer: "cus_attacker",
          subscription: "sub_attacker",
          metadata: {},
          client_reference_id: company.id.to_s
        }
      }
    )

    allow(Stripe::Webhook).to receive(:construct_event).and_return(event)
    allow(Subscriptions::StripeSyncService).to receive(:reconcile).and_return(true)

    post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers

    expect(response).to have_http_status(:bad_request)
    expect(Subscriptions::StripeSyncService).not_to have_received(:reconcile)
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
    allow(Stripe::Subscription).to receive(:list).with(customer: "cus_123", status: "all", limit: 100)
      .and_return(Stripe::ListObject.construct_from(data: [subscription], has_more: false))

    expect do
      post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers
    end.to have_enqueued_job(SubscriptionPurchaseDeliveryJob)

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
    allow(Subscriptions::StripeSyncService).to receive(:reconcile).and_return(true)

    post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers

    expect(response).to have_http_status(:ok)
    expect(Subscriptions::StripeSyncService).to have_received(:reconcile).with(
      stripe_customer_id: "cus_123",
      stripe_subscription_id: "sub_123"
    )
  end

  it "routes checkout payment completions to invoice fulfillment without hitting Stripe" do
    event = OpenStruct.new(
      type: "checkout.session.completed",
      data: OpenStruct.new(object: OpenStruct.new(mode: "payment"))
    )

    allow(Stripe::Webhook).to receive(:construct_event).and_return(event)
    allow(InvoicePayment::StripeCheckoutFulfillment).to receive(:process)
      .with(event)
      .and_return(true)

    post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers

    expect(response).to have_http_status(:ok)
    expect(InvoicePayment::StripeCheckoutFulfillment).to have_received(:process).with(event)
  end

  it "rejects a completed checkout with a mismatched invoice intent without treating it as a server failure" do
    invoice = create(:invoice, company:, status: "sent", amount: 100, amount_due: 100, amount_paid: 0,
      payment_infos: { stripe_payment_intent: "pi_expected" })
    event = Stripe::Event.construct_from(id: "evt_mismatch", type: "checkout.session.completed", created: Time.current.to_i,
      data: { object: { id: "cs_mismatch", mode: "payment", status: "complete", payment_status: "paid", payment_intent: "pi_wrong",
        amount_total: 10_000, currency: "usd", metadata: { invoice_id: invoice.id } } })
    allow(Stripe::Webhook).to receive(:construct_event).and_return(event)

    post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers

    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body).to eq("message" => "Invalid payload!")
    expect(invoice.reload).to be_sent
    expect(invoice.payments).to be_empty
  end

  it "settles invoice payment on payment_intent.succeeded" do
    event = OpenStruct.new(
      type: "payment_intent.succeeded",
      data: OpenStruct.new(
        object: OpenStruct.new(
          id: "pi_123",
          amount_received: 1000,
          amount: 1000,
          currency: "usd"
        )
      ),
      created: Time.zone.now.to_i
    )

    allow(Stripe::Webhook).to receive(:construct_event).and_return(event)
    allow(InvoicePayment::StripePaymentSucceeded).to receive(:process).and_return(true)

    post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers

    expect(response).to have_http_status(:ok)
    expect(InvoicePayment::StripePaymentSucceeded).to have_received(:process).with(event)
  end

  it "acknowledges valid payment_intent.succeeded events that do not settle an invoice" do
    event = OpenStruct.new(
      type: "payment_intent.succeeded",
      data: OpenStruct.new(
        object: OpenStruct.new(
          id: "pi_without_invoice",
          amount_received: 1000,
          amount: 1000,
          currency: "usd"
        )
      ),
      created: Time.zone.now.to_i
    )

    allow(Stripe::Webhook).to receive(:construct_event).and_return(event)
    allow(InvoicePayment::StripePaymentSucceeded).to receive(:process).and_return(false)

    post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers

    expect(response).to have_http_status(:ok)
    expect(InvoicePayment::StripePaymentSucceeded).to have_received(:process).with(event)
  end

  %w[payment_intent.succeeded checkout.session.completed].each do |event_type|
    it "requests a retry and reports a #{event_type} settlement failure" do
      invoice = create(:invoice, company:, status: "sent", amount: 100, amount_due: 100, amount_paid: 0,
        payment_infos: { stripe_payment_intent: "pi_retry" })
      object = if event_type == "payment_intent.succeeded"
        { id: "pi_retry", amount_received: 10_000, currency: "usd" }
      else
        { id: "cs_retry", mode: "payment", status: "complete", payment_status: "paid", payment_intent: "pi_retry",
          amount_total: 10_000, currency: "usd", metadata: { invoice_id: invoice.id } }
      end
      event = Stripe::Event.construct_from(id: "evt_retry", type: event_type, created: Time.current.to_i, data: { object: })
      error = StandardError.new("Synthetic settlement unavailable")
      allow(Stripe::Webhook).to receive(:construct_event).and_return(event)
      allow(InvoicePayment::Settle).to receive(:process).and_raise(error)
      allow(Sentry).to receive(:capture_exception)

      post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers

      expect(response).to have_http_status(:internal_server_error)
      expect(response.parsed_body).to eq("message" => "Payment settlement failed")
      expect(invoice.reload).to be_sent
      expect(invoice.payments).to be_empty
      expect(Sentry).to have_received(:capture_exception).with(error)

      allow(InvoicePayment::Settle).to receive(:process).and_call_original

      expect do
        post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers
      end.to change { invoice.payments.count }.by(1)

      expect(response).to have_http_status(:ok)
      expect(invoice.reload).to be_paid

      expect do
        post "/webhooks/stripe/checkout/fulfillment", params: "{}", headers: headers
      end.not_to change { invoice.payments.count }
      expect(response).to have_http_status(:ok)
    end
  end
end
