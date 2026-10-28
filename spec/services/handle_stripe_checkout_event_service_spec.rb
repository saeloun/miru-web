# frozen_string_literal: true

require "rails_helper"

RSpec.describe HandleStripeCheckoutEventService do
  let(:company) { create(:company, stripe_customer_id: "cus_webhook") }
  let(:active_subscription) do
    Stripe::Subscription.construct_from(
      id: "sub_current", customer: "cus_webhook", status: "active", created: 1,
      current_period_end: 1.month.from_now.to_i, items: { data: [] }
    )
  end

  before do
    company
    allow(Stripe::Subscription).to receive(:list).and_return(
      Stripe::ListObject.construct_from(data: [active_subscription], has_more: false)
    )
  end

  def deliver(type, object)
    event = Stripe::Event.construct_from(type:, data: { object: })
    allow(Stripe::Webhook).to receive(:construct_event).and_return(event)
    service = described_class.new(payload: "signed-payload", stripe_signature: "signature")
    service.process
    expect(service.status).to eq(:ok)
  end

  it "reconciles a repeated completed checkout without duplicate purchase tracking" do
    object = {
      mode: "subscription", customer: "cus_webhook", subscription: "sub_current",
      metadata: { company_id: company.id }, client_reference_id: nil
    }
    expect {
      2.times { deliver("checkout.session.completed", object) }
    }.to change { Ahoy::Event.where(name: "subscription_purchased").count }.by(1)
    expect(company.reload.stripe_subscription_id).to eq("sub_current")
  end

  it "does not downgrade the current subscription for an older duplicate's deleted event" do
    deliver("customer.subscription.deleted", { id: "sub_old", customer: "cus_webhook", status: "canceled" })
    expect(company.reload).to have_attributes(plan_tier: "paid", stripe_subscription_id: "sub_current")
  end

  it "does not project a stale invoice subscription when another subscription is current" do
    deliver("invoice.paid", { id: "in_old", customer: "cus_webhook", subscription: "sub_old" })
    expect(company.reload.stripe_subscription_id).to eq("sub_current")
  end
end
