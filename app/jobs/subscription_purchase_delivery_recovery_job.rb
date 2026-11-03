# frozen_string_literal: true

class SubscriptionPurchaseDeliveryRecoveryJob < ApplicationJob
  queue_as :default

  def perform
    SubscriptionPurchaseEvent.due_for_delivery.each(&:enqueue_delivery)
  end
end
