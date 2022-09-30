# frozen_string_literal: true

class UpdateInvoiceStatusToOverdueJob < ApplicationJob
  def perform(*args)
    UpdateInvoiceStatusToOverdueService.new.process
  end
end
