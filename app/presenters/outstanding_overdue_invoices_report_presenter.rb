# frozen_string_literal: true

class OutstandingOverdueInvoicesReportPresenter
  attr_reader :clients

  def initialize(clients)
    @clients = clients
  end

  def summary
    total_outstanding_amount = clients.pluck(:total_outstanding_amount).sum
    total_overdue_amount = clients.pluck(:total_overdue_amount).sum
    {
      total_outstanding_amount:,
      total_overdue_amount:,
      total_invoice_amount: total_outstanding_amount + total_overdue_amount
    }
    end
end
