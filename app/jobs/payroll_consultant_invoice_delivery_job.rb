# frozen_string_literal: true

class PayrollConsultantInvoiceDeliveryJob < ApplicationJob
  queue_as :default

  def self.enqueue_safely(delivery_id)
    perform_later(delivery_id)
  rescue StandardError => error
    Rails.logger.warn({ event: "consultant_invoice_delivery_enqueue_failed", delivery_id:, error_class: error.class.name }.to_json)
    false
  end

  def perform(delivery_id)
    attempt = PayrollConsultantInvoiceDelivery.find_by(id: delivery_id)
    Payroll::ConsultantInvoiceDelivery.new(attempt).deliver if attempt
  end
end
