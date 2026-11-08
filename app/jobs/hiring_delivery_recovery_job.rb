# frozen_string_literal: true

class HiringDeliveryRecoveryJob < ApplicationJob
  queue_as :default

  def perform = HiringMessage.recover_deliveries
end
