# frozen_string_literal: true

module Subscriptions
  class SeatReconciliationService
    ALLOWED_PRORATION_BEHAVIORS = %w[none create_prorations always_invoice].freeze
    DEFAULT_PRORATION_BEHAVIOR = "none"

    def self.process(...)
      new(...).process
    end

    def initialize(company:)
      @company = company
    end

    def process
      return :skipped unless reconcilable?

      subscription = Stripe::Subscription.retrieve(company.stripe_subscription_id)
      item = single_seat_item(subscription)
      return :skipped if item.nil?

      if item.quantity.nil?
        Rails.logger.warn(
          "SeatReconciliation: company=#{company.id} skipped — item has no quantity (metered price?)"
        )
        return :skipped
      end

      desired = company.billable_team_seats
      current = item.quantity.to_i
      return :in_sync if current == desired

      Stripe::Subscription.update(
        subscription.id,
        items: [{ id: item.id, quantity: desired }],
        proration_behavior: proration_behavior
      )

      Rails.logger.info(
        "SeatReconciliation: company=#{company.id} #{current}->#{desired} " \
        "proration=#{proration_behavior}"
      )
      :updated
    rescue Stripe::StripeError => e
      Rails.logger.error("SeatReconciliation: company=#{company.id} failed: #{e.class}: #{e.message}")
      false
    end

    private

      attr_reader :company

      def reconcilable?
        company.present? &&
          company.plan_tier == "paid" &&
          company.stripe_subscription_id.present? &&
          company.stripe_subscription_active?
      end

      # Only reconcile a subscription with exactly one line item (the seat price).
      # If Stripe ever returns multiple items we do not guess which one is seats.
      def single_seat_item(subscription)
        items = subscription.items&.data
        return nil if items.blank?

        if items.length != 1
          Rails.logger.warn(
            "SeatReconciliation: company=#{company.id} skipped — subscription has #{items.length} line items"
          )
          return nil
        end

        items.first
      end

      def proration_behavior
        value = ENV.fetch("STRIPE_SEAT_PRORATION_BEHAVIOR", DEFAULT_PRORATION_BEHAVIOR)
        ALLOWED_PRORATION_BEHAVIORS.include?(value) ? value : DEFAULT_PRORATION_BEHAVIOR
      end
  end
end
