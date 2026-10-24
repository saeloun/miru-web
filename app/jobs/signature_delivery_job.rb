# frozen_string_literal: true

class SignatureDeliveryJob < ApplicationJob
  self.enqueue_after_transaction_commit = true
  queue_as :default

  def perform(operation_id)
    Signatures::Delivery.new(SignatureOperation.find(operation_id)).process
  end
end
