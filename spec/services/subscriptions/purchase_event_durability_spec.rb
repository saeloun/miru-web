# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Durable subscription purchase announcements" do
  include ActiveJob::TestHelper

  let(:company) { create(:company, plan_tier: "free", stripe_customer_id: "cus_durable") }
  let(:alert_email) { "alerts@example.test" }
  let(:deliveries) { ActionMailer::Base.deliveries }

  before do
    deliveries.clear
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("PLAN_PURCHASE_ALERT_EMAIL").and_return(alert_email)
  end

  def stripe_subscription(id: "sub_durable", status: "active", created: 1)
    Stripe::Subscription.construct_from(
      id:, customer: "cus_durable", status:, created:, current_period_end: 2.months.from_now.to_i,
      items: { data: [{ price: { recurring: { interval: "month" } } }] }
    )
  end

  def stripe_list(*subscriptions)
    Stripe::ListObject.construct_from(data: subscriptions, has_more: false)
  end

  def announce(subscription = stripe_subscription, target = company, notify: true)
    Subscriptions::StripeSyncService.process(company: target, subscription:, notify_plan_purchase: notify)
  end

  def purchase_analytics
    Ahoy::Event.where(name: "subscription_purchased")
  end

  def delivery_jobs
    enqueued_jobs.select { |job| job["job_class"] == "SubscriptionPurchaseDeliveryJob" }
  end

  describe "the paid transition" do
    it "leaves no event or delivery when the transition rolls back" do
      company

      ActiveRecord::Base.transaction(requires_new: true) do
        announce
        expect(company.subscription_purchase_events.count).to eq(1)
        raise ActiveRecord::Rollback
      end

      expect(company.reload.plan_tier).to eq("free")
      expect(SubscriptionPurchaseEvent.count).to eq(0)
      expect(delivery_jobs).to be_empty
    end

    it "keeps only the identifiers and values the announcement needs" do
      announce

      expect(company.subscription_purchase_events.sole).to have_attributes(
        stripe_subscription_id: "sub_durable", subscription_status: "active", subscription_interval: "month",
        seat_quantity: company.billable_team_seats, plan_label: "Paid", notification_required: true,
        tracked_at: nil, notified_at: nil
      )
    end

    it "waits for every enclosing transaction before queueing delivery" do
      ActiveRecord::Base.transaction(requires_new: true) do
        announce
        ActiveRecord::Base.transaction do
          expect(SubscriptionPurchaseEvent.count).to eq(1)
        end
        expect(delivery_jobs).to be_empty
      end

      expect(delivery_jobs.size).to eq(1)
    end

    it "does not queue delivery inside checkout's company transaction" do
      allow(Stripe::Subscription).to receive(:list).and_return(stripe_list(stripe_subscription))
      queued_during_checkout = nil
      allow(Subscriptions::StripeSyncService).to receive(:reconcile).and_wrap_original do |original, **options|
        original.call(**options).tap { queued_during_checkout = delivery_jobs.size }
      end

      result = Subscriptions::CheckoutService.new(
        company:, user: create(:user), price_id: "price_monthly", interval: "monthly", base_url: "http://localhost"
      ).process

      expect(result).to be_nil
      expect(queued_during_checkout).to eq(0)
      expect(delivery_jobs.size).to eq(1)
    end
  end

  describe "concurrent reconciliation" do
    it "creates one event and one delivery" do
      company_id = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection { company.id }
      end.value
      ready = Queue.new
      release = Queue.new
      threads = 2.times.map do
        Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            ready << true
            release.pop
            announce(stripe_subscription, Company.find(company_id))
          end
        end
      end
      2.times { ready.pop }
      2.times { release << true }

      expect(threads.map(&:value)).to all(eq(true))
      expect(SubscriptionPurchaseEvent.where(company_id:).count).to eq(1)
      expect(delivery_jobs.size).to eq(1)
    ensure
      DatabaseCleaner.clean
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          DatabaseCleaner.clean_with(:truncation, except: %w[ar_internal_metadata schema_migrations])
        end
      end.join
    end

    it "lets the unique index stop a duplicate that bypasses the lock" do
      SubscriptionPurchaseEvent.create!(company:, stripe_subscription_id: "sub_durable")

      expect {
        SubscriptionPurchaseEvent.transaction(requires_new: true) do
          SubscriptionPurchaseEvent.create!(company:, stripe_subscription_id: "sub_durable")
        end
      }.to raise_error(ActiveRecord::RecordNotUnique)
    end
  end

  describe "queueing failures" do
    [
      ["Solid Queue's enqueue error", SolidQueue::Job::EnqueueError.new("queue unavailable")],
      ["a database failure", ActiveRecord::ConnectionFailed.new("queue unavailable")],
      ["Active Job's enqueue error", ActiveJob::EnqueueError.new("queue unavailable")]
    ].each do |name, error|
      it "keeps paid access and pending work after #{name}, then recovers" do
        allow_any_instance_of(SubscriptionPurchaseDeliveryJob).to receive(:enqueue).and_raise(error)
        allow(Rails.error).to receive(:report)

        expect(announce).to eq(true)

        event = company.subscription_purchase_events.sole
        expect(company.reload.plan_tier).to eq("paid")
        expect(event.enqueued_at).to be_nil
        expect(Rails.error).to have_received(:report).with(error, hash_including(handled: true))

        allow_any_instance_of(SubscriptionPurchaseDeliveryJob).to receive(:enqueue).and_call_original
        travel(SubscriptionPurchaseEvent::REDELIVERY_DELAY + 1.minute) do
          SubscriptionPurchaseDeliveryRecoveryJob.perform_now
          expect(delivery_jobs.size).to eq(1)
          perform_enqueued_jobs(only: SubscriptionPurchaseDeliveryJob)
        end

        expect(event.reload).to have_attributes(tracked_at: be_present, notified_at: be_present)
        expect(purchase_analytics.count).to eq(1)
        expect(deliveries.size).to eq(1)
      end
    end

    it "reports an enqueue that returns false and keeps the work pending" do
      allow_any_instance_of(SubscriptionPurchaseDeliveryJob).to receive(:enqueue).and_return(false)
      allow(Rails.error).to receive(:report)

      expect(announce).to eq(true)

      expect(company.subscription_purchase_events.sole.enqueued_at).to be_nil
      expect(SubscriptionPurchaseEvent.pending.count).to eq(1)
      expect(Rails.error).to have_received(:report).with(an_instance_of(ActiveJob::EnqueueError), hash_including(handled: true))
    end

    it "recovers when the process dies between the commit and queueing" do
      allow(ActiveRecord).to receive(:after_all_transactions_commit)

      announce

      event = company.subscription_purchase_events.sole
      expect(delivery_jobs).to be_empty

      SubscriptionPurchaseDeliveryRecoveryJob.perform_now
      expect(delivery_jobs).to be_empty

      travel(SubscriptionPurchaseEvent::REDELIVERY_DELAY + 1.minute) do
        SubscriptionPurchaseDeliveryRecoveryJob.perform_now
        expect(delivery_jobs.size).to eq(1)
        perform_enqueued_jobs(only: SubscriptionPurchaseDeliveryJob)
      end

      expect(event.reload.notified_at).to be_present
    end

    it "drains a bounded batch oldest first" do
      stub_const("SubscriptionPurchaseEvent::BATCH_SIZE", 2)
      events = 3.times.map do |index|
        SubscriptionPurchaseEvent.create!(company:, stripe_subscription_id: "sub_#{index}", created_at: 1.day.ago)
      end

      SubscriptionPurchaseDeliveryRecoveryJob.perform_now

      expect(delivery_jobs.size).to eq(2)
      expect(events.map { |event| event.reload.enqueued_at.present? }).to eq([true, true, false])
    end
  end

  describe "delivery" do
    let(:event) { company.subscription_purchase_events.sole }

    before { announce }

    it "records analytics once and sends the alert with the stored values" do
      SubscriptionPurchaseDeliveryJob.perform_now(event)

      expect(purchase_analytics.sole.properties).to include(
        "company_id" => company.id, "subscription_id" => "sub_durable", "subscription_status" => "active",
        "purchase_event_id" => event.id
      )
      expect(deliveries.sole.to).to eq([alert_email])
      expect(deliveries.sole.body.encoded).to include("sub_durable")
      expect(event.reload).to have_attributes(tracked_at: be_present, notified_at: be_present)
    end

    it "retries a transient mail failure without touching paid access or recording analytics twice" do
      clear_enqueued_jobs
      mail = instance_double(ActionMailer::MessageDelivery)
      mailer = double(plan_purchased: mail)
      allow(SubscriptionMailer).to receive(:with).and_return(mailer)
      allow(mail).to receive(:deliver_now).and_raise(Net::OpenTimeout, "mail provider unavailable")

      SubscriptionPurchaseDeliveryJob.perform_now(event)

      expect(company.reload.plan_tier).to eq("paid")
      expect(event.reload).to have_attributes(tracked_at: be_present, notified_at: nil)
      expect(SubscriptionPurchaseEvent.pending).to include(event)
      expect(delivery_jobs.size).to eq(1)

      allow(SubscriptionMailer).to receive(:with).and_call_original
      perform_enqueued_jobs(only: SubscriptionPurchaseDeliveryJob)

      expect(event.reload.notified_at).to be_present
      expect(purchase_analytics.count).to eq(1)
      expect(deliveries.size).to eq(1)
    end

    it "does nothing further when a finished event is delivered again" do
      SubscriptionPurchaseDeliveryJob.perform_now(event)
      clear_enqueued_jobs

      expect { SubscriptionPurchaseDeliveryJob.perform_now(event) }
        .not_to change { [purchase_analytics.count, deliveries.size] }

      travel(SubscriptionPurchaseEvent::REDELIVERY_DELAY + 1.minute) do
        SubscriptionPurchaseDeliveryRecoveryJob.perform_now
      end
      expect(delivery_jobs).to be_empty
    end

    it "does not count a swallowed analytics failure as tracked, and still sends the alert" do
      allow_any_instance_of(Ahoy::Tracker).to receive(:track).and_return(nil)
      clear_enqueued_jobs

      SubscriptionPurchaseDeliveryJob.perform_now(event)

      expect(event.reload).to have_attributes(tracked_at: nil, notified_at: be_present)
      expect(deliveries.size).to eq(1)
      expect(delivery_jobs.size).to eq(1)

      allow_any_instance_of(Ahoy::Tracker).to receive(:track).and_call_original
      perform_enqueued_jobs(only: SubscriptionPurchaseDeliveryJob)

      expect(event.reload.tracked_at).to be_present
      expect(purchase_analytics.count).to eq(1)
      expect(deliveries.size).to eq(1)
    end

    it "finishes without mail when no alert address is configured" do
      allow(ENV).to receive(:[]).with("PLAN_PURCHASE_ALERT_EMAIL").and_return(nil)
      expect(Rails.logger).to receive(:warn).with(/PLAN_PURCHASE_ALERT_EMAIL/)

      SubscriptionPurchaseDeliveryJob.perform_now(event)

      expect(deliveries).to be_empty
      expect(event.reload).to have_attributes(tracked_at: be_present, notification_required: false, notified_at: nil)
      expect(SubscriptionPurchaseEvent.pending).not_to include(event)
    end

    it "discards a job whose event has been removed" do
      clear_enqueued_jobs
      job = SubscriptionPurchaseDeliveryJob.new(event)
      serialized = job.serialize
      event.destroy!

      expect { ActiveJob::Base.execute(serialized) }.not_to raise_error
      expect(deliveries).to be_empty
    end
  end

  describe "what counts as a purchase" do
    it "announces a genuinely new subscription after a cancellation" do
      announce
      company.reload.revoke_stripe_subscription_access!
      announce(stripe_subscription(id: "sub_new", created: 2), company.reload)

      expect(company.subscription_purchase_events.pluck(:stripe_subscription_id))
        .to contain_exactly("sub_durable", "sub_new")
      expect(delivery_jobs.size).to eq(2)
    end

    it "does not announce the same subscription again when it recovers from unpaid" do
      announce
      announce(stripe_subscription(status: "unpaid"), company.reload)
      expect(company.reload.plan_tier).to eq("free")
      announce(stripe_subscription(status: "active"), company)

      expect(company.reload.plan_tier).to eq("paid")
      expect(company.subscription_purchase_events.count).to eq(1)
      expect(delivery_jobs.size).to eq(1)
    end

    it "does not treat a trial becoming active as another purchase" do
      announce(stripe_subscription(status: "trialing"))
      announce(stripe_subscription(status: "active"), company.reload)

      expect(company.subscription_purchase_events.count).to eq(1)
      expect(delivery_jobs.size).to eq(1)
    end

    it "does not announce an already paid subscription that predates these records" do
      company.update!(plan_tier: "paid", stripe_subscription_id: "sub_durable", subscription_status: "active")

      announce

      expect(SubscriptionPurchaseEvent.count).to eq(0)
      expect(delivery_jobs).to be_empty
    end

    it "still alerts when a generic update activated the purchase before the checkout webhook" do
      announce(stripe_subscription, company, notify: false)
      event = company.subscription_purchase_events.sole
      expect(event.notification_required).to eq(false)
      perform_enqueued_jobs(only: SubscriptionPurchaseDeliveryJob)
      expect(deliveries).to be_empty

      announce(stripe_subscription, company.reload, notify: true)
      perform_enqueued_jobs(only: SubscriptionPurchaseDeliveryJob)

      expect(event.reload.notified_at).to be_present
      expect(deliveries.size).to eq(1)
      expect(purchase_analytics.count).to eq(1)
    end

    it "does not alert twice when the checkout webhook is replayed" do
      announce
      perform_enqueued_jobs(only: SubscriptionPurchaseDeliveryJob)
      clear_enqueued_jobs

      announce(stripe_subscription, company.reload)

      expect(delivery_jobs).to be_empty
      expect(deliveries.size).to eq(1)
    end
  end
end
