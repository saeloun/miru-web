# frozen_string_literal: true

require "rails_helper"

RSpec.describe SyncStripeSubscriptionsJob, type: :job do
  it "syncs every company with a Stripe customer" do
    company_one = create(:company, stripe_customer_id: "cus_1")
    company_two = create(:company, stripe_customer_id: "cus_2")
    create(:company, stripe_customer_id: nil)

    allow(Subscriptions::StripeSyncService).to receive(:process).and_return(true)

    described_class.perform_now

    expect(Subscriptions::StripeSyncService).to have_received(:process).with(company: company_one)
    expect(Subscriptions::StripeSyncService).to have_received(:process).with(company: company_two)
    expect(Subscriptions::StripeSyncService).to have_received(:process).twice
  end
end
