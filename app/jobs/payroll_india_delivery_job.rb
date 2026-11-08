# frozen_string_literal: true

class PayrollIndiaDeliveryJob < ApplicationJob
  queue_as :default

  def perform(delivery_id) = Payroll::IndiaDelivery.new(PayrollIndiaDelivery.find(delivery_id)).deliver
end
