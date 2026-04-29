# frozen_string_literal: true

require "rails_helper"

RSpec.describe Subscriptions::StripeSyncService do
  describe ".process" do
    let(:company) { create(:company, plan_tier: "free") }

    it "updates the company from an active Stripe subscription" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("PLAN_PURCHASE_ALERT_EMAIL").and_return("vipul@saeloun.com")

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

      expect do
        result = described_class.process(company:, subscription:, notify_plan_purchase: true)

        expect(result).to eq(true)
      end.to have_enqueued_mail(SubscriptionMailer, :plan_purchased)

      expect(company.reload.plan_tier).to eq("paid")
      expect(company.stripe_customer_id).to eq("cus_123")
      expect(company.stripe_subscription_id).to eq("sub_123")
      expect(company.subscription_status).to eq("active")
      expect(company.subscription_interval).to eq("month")
      expect(company.subscription_ends_at).to eq(Time.zone.local(2026, 4, 10, 12, 0, 0))
    end

    it "updates the company from a hash-like Stripe subscription payload" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("PLAN_PURCHASE_ALERT_EMAIL").and_return("vipul@saeloun.com")
      allow(ENV).to receive(:[]).with("APP_BASE_URL").and_return("https://app.miru.so")

      subscription = {
        "id" => "sub_hash_123",
        "customer" => "cus_hash_123",
        "status" => "active",
        "current_period" => {
          "end" => Time.zone.local(2026, 5, 10, 12, 0, 0).to_i
        },
        "items" => {
          "data" => [
            {
              "price" => {
                "recurring" => {
                  "interval" => "year"
                }
              }
            }
          ]
        }
      }

      expect do
        result = described_class.process(company:, subscription:, notify_plan_purchase: true)

        expect(result).to eq(true)
      end.to have_enqueued_mail(SubscriptionMailer, :plan_purchased)

      expect(company.reload.plan_tier).to eq("paid")
      expect(company.stripe_customer_id).to eq("cus_hash_123")
      expect(company.stripe_subscription_id).to eq("sub_hash_123")
      expect(company.subscription_status).to eq("active")
      expect(company.subscription_interval).to eq("year")
      expect(company.subscription_ends_at).to eq(Time.zone.local(2026, 5, 10, 12, 0, 0))
    end

    it "does not email again when an already-paid subscription refreshes" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("PLAN_PURCHASE_ALERT_EMAIL").and_return("vipul@saeloun.com")

      company.update!(
        plan_tier: "paid",
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_123",
        subscription_status: "active",
        subscription_interval: "month"
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

      expect do
        result = described_class.process(company:, subscription:, notify_plan_purchase: true)

        expect(result).to eq(true)
      end.not_to have_enqueued_mail(SubscriptionMailer, :plan_purchased)
    end

    it "skips the alert when no alert email is configured" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("PLAN_PURCHASE_ALERT_EMAIL").and_return(nil)

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

      expect(Rails.logger).to receive(:warn).with(/PLAN_PURCHASE_ALERT_EMAIL/)

      expect do
        result = described_class.process(company:, subscription:, notify_plan_purchase: true)

        expect(result).to eq(true)
      end.not_to have_enqueued_mail(SubscriptionMailer, :plan_purchased)
    end

    it "does not send a purchase alert for generic subscription reconciliation" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("PLAN_PURCHASE_ALERT_EMAIL").and_return("vipul@saeloun.com")

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

      expect do
        result = described_class.process(company:, subscription:)

        expect(result).to eq(true)
      end.not_to have_enqueued_mail(SubscriptionMailer, :plan_purchased)
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
