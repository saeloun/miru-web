# frozen_string_literal: true

class HiringIntakeJob < ApplicationJob
  queue_as :default

  def perform(receipt_id)
    receipt = HiringReceipt.find_by(id: receipt_id)
    Hiring::EmailIntake.new(receipt).process if receipt
  end
end
