# frozen_string_literal: true

class HiringDeliveryJob < ApplicationJob
  queue_as :default

  def perform(message_id) = Hiring::Delivery.new(HiringMessage.find(message_id)).deliver
end
