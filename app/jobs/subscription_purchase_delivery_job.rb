# frozen_string_literal: true

class SubscriptionPurchaseDeliveryJob < ApplicationJob
  queue_as :default

  retry_on StandardError, wait: :polynomially_longer, attempts: 5
  discard_on ActiveJob::DeserializationError

  def perform(event)
    Subscriptions::PurchaseEventDelivery.new(event).process
  end
end
