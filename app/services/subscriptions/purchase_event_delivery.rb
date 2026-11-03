# frozen_string_literal: true

module Subscriptions
  class PurchaseEventDelivery
    class AnalyticsNotRecorded < StandardError; end

    def initialize(event)
      @event = event
      @company = event.company
    end

    def process
      failures = [:record_analytics, :send_alert].filter_map do |step|
        send(step)
        nil
      rescue StandardError => error
        error
      end
      failures.drop(1).each { |error| Rails.error.report(error, handled: true, context: error_context) }
      raise failures.first if failures.any?
    end

    private

      attr_reader :event, :company

      def record_analytics
        event.with_lock do
          next if event.tracked_at?

          Analytics::TrackingService.new.track_subscription_purchased(
            company,
            subscription_id: event.stripe_subscription_id,
            subscription_status: event.subscription_status,
            purchase_event_id: event.id,
            interval: event.subscription_interval,
            seat_quantity: event.seat_quantity,
            converted_at: event.created_at
          )
          raise AnalyticsNotRecorded, "Purchase event #{event.id} was not recorded" unless analytics_recorded?

          event.update!(tracked_at: Time.current)
        end
      end

      def analytics_recorded?
        Ahoy::Event.where(name: "subscription_purchased")
          .where("properties @> ?", { purchase_event_id: event.id }.to_json).exists?
      end

      def send_alert
        event.with_lock do
          next if !event.notification_required? || event.notified_at?

          alert_email = ENV["PLAN_PURCHASE_ALERT_EMAIL"].to_s.presence
          if alert_email
            alert_mail(alert_email).message.deliver
            event.update!(notified_at: Time.current)
          else
            Rails.logger.warn("PLAN_PURCHASE_ALERT_EMAIL is not configured; skipping plan purchase alert")
            event.update!(notification_required: false)
          end
        end
      end

      def alert_mail(alert_email)
        SubscriptionMailer.with(
          company_id: company.id,
          alert_email:,
          plan_label: event.plan_label,
          stripe_subscription_id: event.stripe_subscription_id,
          subscription_interval: event.subscription_interval,
          seat_quantity: event.seat_quantity,
          billing_url: "#{ENV['APP_BASE_URL']}/settings/billing"
        ).plan_purchased
      end

      def error_context
        { subscription_purchase_event_id: event.id,
          recovery: "Retried automatically by SubscriptionPurchaseDeliveryRecoveryJob; see docs/ai/stripe.md#purchase-announcements" }
      end
  end
end
