# frozen_string_literal: true

module Subscriptions
  class StripeSyncService
    def self.process(...)
      new(...).process
    end

    def initialize(company: nil, stripe_customer_id: nil, stripe_subscription_id: nil, subscription: nil, notify_plan_purchase: false)
      @company = company
      @stripe_customer_id = stripe_customer_id
      @stripe_subscription_id = stripe_subscription_id
      @subscription = subscription
      @notify_plan_purchase = notify_plan_purchase
    end

    def process
      target_company = company || find_company
      return false if target_company.blank?

      stripe_subscription = subscription || fetch_subscription(target_company)
      return disable_company!(target_company) if stripe_subscription.blank?

      sync_company!(target_company, stripe_subscription)
      true
    rescue Stripe::StripeError
      false
    end

    private

      attr_reader :company, :stripe_customer_id, :stripe_subscription_id, :subscription, :notify_plan_purchase

      def find_company
        if stripe_subscription_id.present? && Company.column_names.include?("stripe_subscription_id")
          match = Company.find_by(stripe_subscription_id:)
          return match if match.present?
        end

        return if stripe_customer_id.blank?

        Company.find_by(stripe_customer_id:)
      end

      def fetch_subscription(target_company)
        if stripe_subscription_id.present?
          Stripe::Subscription.retrieve(stripe_subscription_id)
        elsif target_company.respond_to?(:stripe_subscription_id) && target_company.stripe_subscription_id.present?
          Stripe::Subscription.retrieve(target_company.stripe_subscription_id)
        elsif target_company.stripe_customer_id.present?
          subscriptions = Stripe::Subscription.list(customer: target_company.stripe_customer_id, status: "all", limit: 3)
          subscriptions.data.max_by { |item| item.current_period_end.to_i }
        end
      end

      def sync_company!(target_company, stripe_subscription)
        was_paid = target_company.plan_tier == "paid"
        subscription_period_end = stripe_subscription_period_end(stripe_subscription)

        target_company.apply_stripe_subscription!(
          stripe_customer_id: subscription_value(stripe_subscription, :customer),
          stripe_subscription_id: subscription_value(stripe_subscription, :id),
          subscription_status: subscription_value(stripe_subscription, :status),
          subscription_ends_at: timestamp_to_time(subscription_period_end),
          subscription_interval: stripe_subscription_interval(stripe_subscription)
        )

        if notify_plan_purchase && !was_paid && target_company.plan_tier == "paid"
          notify_plan_purchase!(target_company, stripe_subscription)
        end
      end

      def disable_company!(target_company)
        target_company.revoke_stripe_subscription_access!
      end

      def timestamp_to_time(value)
        return if value.blank?

        Time.zone.at(value)
      end

      def stripe_subscription_interval(stripe_subscription)
        items = subscription_value(stripe_subscription, :items)
        first_item =
          value_from(items, :data)&.first ||
          value_from(items, "data")&.first
        price = value_from(first_item, :price) || value_from(first_item, "price")
        recurring = value_from(price, :recurring) || value_from(price, "recurring")

        value_from(recurring, :interval) || value_from(recurring, "interval")
      end

      def stripe_subscription_period_end(stripe_subscription)
        value_from(stripe_subscription, :current_period_end) ||
          value_from(stripe_subscription, "current_period_end") ||
          value_from(value_from(stripe_subscription, :current_period), :end) ||
          value_from(value_from(stripe_subscription, "current_period"), "end")
      end

      def subscription_value(stripe_subscription, key)
        value_from(stripe_subscription, key) || value_from(stripe_subscription, key.to_s)
      end

      def value_from(object, key)
        return if object.nil?

        if object.respond_to?(:[])
          value = object[key]
          return value unless value.nil?
        end

        object.public_send(key) if object.respond_to?(key)
      rescue NoMethodError, TypeError, IndexError
        nil
      end

      def notify_plan_purchase!(target_company, stripe_subscription)
        alert_email = ENV["PLAN_PURCHASE_ALERT_EMAIL"].to_s.presence
        unless alert_email
          Rails.logger.warn("PLAN_PURCHASE_ALERT_EMAIL is not configured; skipping plan purchase alert")
          return
        end

        SubscriptionMailer.with(
          company_id: target_company.id,
          alert_email:,
          plan_label: target_company.current_plan_label.to_s.humanize.titleize,
          stripe_subscription_id: subscription_value(stripe_subscription, :id),
          subscription_interval: stripe_subscription_interval(stripe_subscription),
          seat_quantity: target_company.billable_team_seats,
          billing_url: "#{ENV['APP_BASE_URL']}/settings/billing"
        ).plan_purchased.deliver_later
      end
  end
end
