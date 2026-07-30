# frozen_string_literal: true

require "rails_helper"

RSpec.describe Subscriptions::SeatReconciliationService do
  describe ".process" do
    let(:company) do
      create(
        :company,
        plan_tier: "paid",
        stripe_subscription_id: "sub_123",
        subscription_status: "active"
      )
    end
    let(:current_qty) { 5 }
    let(:subscription) do
      OpenStruct.new(
        id: "sub_123",
        items: OpenStruct.new(data: [OpenStruct.new(id: "si_1", quantity: current_qty)])
      )
    end

    before do
      allow(company).to receive(:billable_team_seats).and_return(8)
      allow(Stripe::Subscription).to receive(:retrieve).and_return(subscription)
      allow(Stripe::Subscription).to receive(:update)
    end

    it "updates an under-billed subscription" do
      result = described_class.process(company:)

      expect(result).to eq(:updated)
      expect(Stripe::Subscription).to have_received(:update).once.with(
        "sub_123",
        items: [{ id: "si_1", quantity: 8 }],
        proration_behavior: "none"
      )
    end

    it "updates an over-billed subscription" do
      allow(company).to receive(:billable_team_seats).and_return(2)

      result = described_class.process(company:)

      expect(result).to eq(:updated)
      expect(Stripe::Subscription).to have_received(:update).once.with(
        "sub_123",
        items: [{ id: "si_1", quantity: 2 }],
        proration_behavior: "none"
      )
    end

    it "does not update an in-sync subscription" do
      allow(company).to receive(:billable_team_seats).and_return(5)

      result = described_class.process(company:)

      expect(result).to eq(:in_sync)
      expect(Stripe::Subscription).not_to have_received(:update)
    end

    it "skips a company that is not paid" do
      company.update!(plan_tier: "free")

      result = described_class.process(company:)

      expect(result).to eq(:skipped)
      expect(Stripe::Subscription).not_to have_received(:retrieve)
      expect(Stripe::Subscription).not_to have_received(:update)
    end

    it "skips a company without a subscription id" do
      company.update!(stripe_subscription_id: nil)

      result = described_class.process(company:)

      expect(result).to eq(:skipped)
      expect(Stripe::Subscription).not_to have_received(:retrieve)
      expect(Stripe::Subscription).not_to have_received(:update)
    end

    it "skips a company with an inactive subscription" do
      company.update!(subscription_status: "canceled")

      result = described_class.process(company:)

      expect(result).to eq(:skipped)
      expect(Stripe::Subscription).not_to have_received(:retrieve)
      expect(Stripe::Subscription).not_to have_received(:update)
    end

    it "skips a subscription with multiple items" do
      subscription.items.data << OpenStruct.new(id: "si_2", quantity: 1)

      result = described_class.process(company:)

      expect(result).to eq(:skipped)
      expect(Stripe::Subscription).not_to have_received(:update)
    end

    it "skips a subscription item without a quantity" do
      subscription.items.data.first.quantity = nil

      result = described_class.process(company:)

      expect(result).to eq(:skipped)
      expect(Stripe::Subscription).not_to have_received(:update)
    end

    it "returns false when Stripe raises an error" do
      allow(Stripe::Subscription).to receive(:retrieve)
        .and_raise(Stripe::InvalidRequestError.new("boom", "id"))

      expect(described_class.process(company:)).to eq(false)
      expect(Stripe::Subscription).not_to have_received(:update)
    end

    it "uses a valid proration override and falls back to none for an invalid value" do
      allow(ENV).to receive(:fetch).and_call_original
      allow(ENV).to receive(:fetch)
        .with("STRIPE_SEAT_PRORATION_BEHAVIOR", "none")
        .and_return("create_prorations")

      result = described_class.process(company:)

      expect(result).to eq(:updated)
      expect(Stripe::Subscription).to have_received(:update).with(
        "sub_123",
        items: [{ id: "si_1", quantity: 8 }],
        proration_behavior: "create_prorations"
      )

      allow(ENV).to receive(:fetch)
        .with("STRIPE_SEAT_PRORATION_BEHAVIOR", "none")
        .and_return("invalid")

      result = described_class.process(company:)

      expect(result).to eq(:updated)
      expect(Stripe::Subscription).to have_received(:update).with(
        "sub_123",
        items: [{ id: "si_1", quantity: 8 }],
        proration_behavior: "none"
      )
    end
  end

  it "does not bill a client-portal user when reconciling the actual billable seat count" do
    company = create(
      :company,
      plan_tier: "paid",
      stripe_subscription_id: "sub_123",
      subscription_status: "active"
    )
    team_members = create_list(:user, 2, current_workspace_id: company.id)
    client_portal_user = create(:user, current_workspace_id: company.id)

    team_members.each do |user|
      create(:employment, company:, user:)
      user.add_role(:employee, company)
    end
    create(:employment, company:, user: client_portal_user)
    client_portal_user.add_role(:client, company)

    subscription = OpenStruct.new(
      id: "sub_123",
      items: OpenStruct.new(data: [OpenStruct.new(id: "si_1", quantity: 1)])
    )
    allow(Stripe::Subscription).to receive(:retrieve).and_return(subscription)
    allow(Stripe::Subscription).to receive(:update)

    result = described_class.process(company:)

    expect(company.billable_team_seats).to eq(2)
    expect(Stripe::Subscription).to have_received(:update).once.with(
      "sub_123",
      items: [{ id: "si_1", quantity: 2 }],
      proration_behavior: "none"
    )
    expect(result).to eq(:updated)
  end
end
