# frozen_string_literal: true

class SubscriptionPurchaseEvent < ApplicationRecord
  REDELIVERY_DELAY = 15.minutes
  BATCH_SIZE = 100
  MAX_BACKOFF_STEPS = 6

  belongs_to :company

  validates :stripe_subscription_id, presence: true

  scope :pending, -> { where("tracked_at IS NULL OR (notification_required AND notified_at IS NULL)") }
  scope :due_for_delivery, -> {
    pending.where(
      "COALESCE(enqueued_at, created_at) + make_interval(secs => ? * power(2, LEAST(GREATEST(enqueue_count - 1, 0), ?))) <= ?",
      REDELIVERY_DELAY.to_i, MAX_BACKOFF_STEPS, Time.current
    ).order(:id).limit(BATCH_SIZE)
  }

  def enqueue_delivery
    job = SubscriptionPurchaseDeliveryJob.new(self)
    if job.enqueue
      update!(enqueued_at: Time.current, enqueue_count: enqueue_count + 1)
    else
      report_enqueue_failure(job.enqueue_error || ActiveJob::EnqueueError.new("Purchase delivery was not queued"))
    end
  rescue ActiveJob::EnqueueError, ActiveRecord::ActiveRecordError, SolidQueue::Job::EnqueueError => error
    report_enqueue_failure(error)
  end

  private

    def report_enqueue_failure(error)
      Rails.error.report(error, handled: true, context: { subscription_purchase_event_id: id,
        recovery: "Retried automatically by SubscriptionPurchaseDeliveryRecoveryJob; see docs/ai/stripe.md#purchase-announcements" })
    end
end
