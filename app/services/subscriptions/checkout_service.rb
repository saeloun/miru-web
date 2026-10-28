# frozen_string_literal: true

module Subscriptions
  class CheckoutService
    def initialize(company:, user:, price_id:, interval:, base_url:)
      @company, @user, @price_id, @interval, @base_url = company, user, price_id, interval, base_url
    end

    # Serialize checkout attempts across app processes, including customer creation.
    # Return nil when billing already exists; commit any recovered entitlement.
    def process
      company.with_lock do
        next if company.billing_exempt? || company.plan_tier == "paid"

        ensure_customer!
        subscriptions = Stripe::Subscription.list(customer: company.stripe_customer_id, status: "all", limit: 100)
          .auto_paging_each.to_a
        next if reconcile_existing_subscription(subscriptions)

        sessions = Stripe::Checkout::Session.list(customer: company.stripe_customer_id, limit: 100)
          .auto_paging_each.select { |session| session.mode == "subscription" }
        quantity = company.billable_team_seats
        open_session = reusable_session(sessions, quantity)
        next open_session if open_session

        # A completion may race the subscription-list request. Never replace a
        # completed checkout until Stripe confirms its subscription is terminal.
        terminal_ids = subscriptions.map(&:id)
        next if sessions.any? { |session| session.status == "complete" && !terminal_ids.include?(session.subscription) }

        create_session(sessions, quantity)
      end
    end

    private

      attr_reader :company, :user, :price_id, :interval, :base_url

      def reconcile_existing_subscription(subscriptions)
        return false if subscriptions.all? { |subscription| %w[canceled incomplete_expired].include?(subscription.status) }

        StripeSyncService.reconcile(company:)
        true
      end

      def reusable_session(sessions, quantity)
        reusable = nil
        sessions.select { |session| session.status == "open" }.each do |session|
          if reusable.nil? && matching_items?(session, quantity)
            reusable = session
          else
            # Stripe rejects expiration if payment completed concurrently. Let
            # that error abort this attempt; the next request reconciles billing.
            Stripe::Checkout::Session.expire(session.id)
          end
        end
        reusable
      end

      def create_session(sessions, quantity)
        last_session = sessions.max_by { |session| [session.created, session.id] }
        Stripe::Checkout::Session.create({
          mode: "subscription", customer: company.stripe_customer_id,
          line_items: [{ price: price_id, quantity: }],
          success_url: "#{base_url}/settings/billing?billing=success",
          cancel_url: "#{base_url}/settings/billing?billing=cancelled",
          metadata: { company_id: company.id, billing_interval: interval, seat_quantity: quantity }
        }, { idempotency_key: "company-#{company.id}-checkout-after-#{last_session&.id || 'initial'}" })
      end

      def matching_items?(session, quantity)
        items = Stripe::Checkout::Session.list_line_items(session.id, limit: 2).data
        items.size == 1 && items.first.price.id == price_id && items.first.quantity == quantity
      end

      def ensure_customer!
        return if company.stripe_customer_id.present?

        customer = Stripe::Customer.create({
          name: company.name, email: user.email, metadata: { company_id: company.id }
        }, { idempotency_key: "company-#{company.id}-subscription-customer" })
        company.update!(stripe_customer_id: customer.id)
      end
  end
end
