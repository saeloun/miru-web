# frozen_string_literal: true

class PayrollConsultantInvoiceIssueJob < ApplicationJob
  queue_as :default

  def self.enqueue_safely(run_id, employment_id)
    perform_later(run_id, employment_id)
  rescue StandardError => error
    Rails.logger.warn({ event: "consultant_invoice_enqueue_failed", run_id:, employment_id:, error_class: error.class.name }.to_json)
    false
  end

  def perform(run_id, employment_id)
    run = PayrollRun.find_by(id: run_id)
    Payroll::ConsultantInvoiceIssue.new(run, employment_id:).issue! if run
  end
end
