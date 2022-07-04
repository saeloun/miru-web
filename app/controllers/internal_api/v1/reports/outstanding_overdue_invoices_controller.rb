
# frozen_string_literal: true

class InternalApi::V1::Reports::OutstandingOverdueInvoicesController < InternalApi::V1::ApplicationController
  def index
    authorize :report
    render :index, locals: { clients:, summary: }, status: :ok
  end

  private

    def clients
      @_clients ||= current_company.clients.order("name asc").includes(:invoices).map do |client|
                      client.outstanding_and_overdue_invoices
                    end
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
