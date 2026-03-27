# frozen_string_literal: true

require "rails_helper"

RSpec.describe SyncStripeSubscriptionCompanyJob, type: :job do
  it "syncs the requested company" do
    company = create(:company, stripe_customer_id: "cus_1")

    allow(Subscriptions::StripeSyncService).to receive(:process).and_return(true)

    described_class.perform_now(company.id)

    expect(Subscriptions::StripeSyncService).to have_received(:process).with(company:)
  end

  it "skips companies without an active stripe customer id" do
    company = create(:company, stripe_customer_id: nil)

    allow(Subscriptions::StripeSyncService).to receive(:process)

    described_class.perform_now(company.id)

    expect(Subscriptions::StripeSyncService).not_to have_received(:process)
  end
end
