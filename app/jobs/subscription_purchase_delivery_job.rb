# frozen_string_literal: true

class SubscriptionPurchaseDeliveryJob < ApplicationJob
  queue_as :default

  retry_on StandardError, wait: :polynomially_longer, attempts: 5 do |job, error|
    Rails.error.report(error, handled: true, context: { subscription_purchase_event_id: job.arguments.first.id,
      recovery: SubscriptionPurchaseEvent::RECOVERY_GUIDANCE })
    raise error
  end
  discard_on ActiveJob::DeserializationError

  def perform(event)
    Subscriptions::PurchaseEventDelivery.new(event).process
  end
end
