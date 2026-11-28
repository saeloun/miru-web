# frozen_string_literal: true

class Payroll::ConsultantInvoiceOriginalCleanupJob < ApplicationJob
  retry_on StandardError, wait: :polynomially_longer, attempts: 5

  def perform(blob_id)
    Payroll::ConsultantInvoicePreparation.cleanup_original_blob(blob_id)
  end
end
