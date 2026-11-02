# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Purchase delivery through Solid Queue" do
  let(:company) { create(:company, plan_tier: "free", stripe_customer_id: "cus_queue") }
  let(:subscription) do
    Stripe::Subscription.construct_from(
      id: "sub_queue", customer: "cus_queue", status: "active", created: 1,
      items: { data: [{ price: { recurring: { interval: "month" } } }] }
    )
  end
  let(:queued) { SolidQueue::Job.where(class_name: "SubscriptionPurchaseDeliveryJob") }

  before { ActiveJob::Base.queue_adapter = :solid_queue }

  def announce
    Subscriptions::StripeSyncService.process(company:, subscription:, notify_plan_purchase: true)
  end

  it "stores the job after the company transaction and records that it was queued" do
    ActiveRecord::Base.transaction(requires_new: true) do
      announce
      expect(queued.count).to eq(0)
    end

    expect(queued.count).to eq(1)
    expect(company.subscription_purchase_events.sole.enqueued_at).to be_present
  end

  it "keeps paid access and pending work when the queue store rejects the job" do
    allow(SolidQueue::Job).to receive(:create!).and_raise(ActiveRecord::StatementInvalid, "queue store unavailable")
    allow(Rails.error).to receive(:report)

    expect(announce).to eq(true)

    expect(company.reload.plan_tier).to eq("paid")
    expect(queued.count).to eq(0)
    expect(company.subscription_purchase_events.sole.enqueued_at).to be_nil
    expect(SubscriptionPurchaseEvent.pending.count).to eq(1)
    expect(Rails.error).to have_received(:report).with(an_instance_of(SolidQueue::Job::EnqueueError), hash_including(handled: true))
  end
end
