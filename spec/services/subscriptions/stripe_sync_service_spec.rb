# frozen_string_literal: true

require "rails_helper"

RSpec.describe Subscriptions::StripeSyncService do
  describe ".process" do
    let(:company) { create(:company, plan_tier: "free") }

    it "updates the company from an active Stripe subscription" do
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

      result = described_class.process(company:, subscription:)

      expect(result).to eq(true)
      expect(company.reload.plan_tier).to eq("paid")
      expect(company.stripe_customer_id).to eq("cus_123")
      expect(company.stripe_subscription_id).to eq("sub_123")
      expect(company.subscription_status).to eq("active")
      expect(company.subscription_interval).to eq("month")
      expect(company.subscription_ends_at).to eq(Time.zone.local(2026, 4, 10, 12, 0, 0))
    end

    it "revokes access when no subscription can be found" do
      company.update!(
        plan_tier: "paid",
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_123",
        subscription_status: "active",
        subscription_interval: "month"
      )

      allow(Stripe::Subscription).to receive(:retrieve).and_raise(Stripe::InvalidRequestError.new("missing", "id"))

      result = described_class.process(company:)

      expect(result).to eq(false)
      expect(company.reload.plan_tier).to eq("paid")
    end

    it "downgrades canceled subscriptions to free" do
      subscription = OpenStruct.new(
        id: "sub_123",
        customer: "cus_123",
        status: "canceled",
        current_period_end: nil,
        items: OpenStruct.new(
          data: [
            OpenStruct.new(
              price: OpenStruct.new(
                recurring: OpenStruct.new(interval: "year")
              )
            )
          ]
        )
      )

      result = described_class.process(company:, subscription:)

      expect(result).to eq(true)
      expect(company.reload.plan_tier).to eq("free")
      expect(company.subscription_status).to eq("canceled")
      expect(company.subscription_interval).to eq("year")
    end
  end
end
