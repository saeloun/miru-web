# frozen_string_literal: true

class PayrollIndiaRecoveryJob < ApplicationJob
  queue_as :default

  def perform
    PayrollIndiaDelivery.where(state: "queued").or(
      PayrollIndiaDelivery.where(state: "sending").where("started_at <= ?", Payroll::IndiaDelivery::STALE_AFTER.ago)
    ).find_each { |delivery| PayrollIndiaDeliveryJob.perform_later(delivery.id) }
  end
end
