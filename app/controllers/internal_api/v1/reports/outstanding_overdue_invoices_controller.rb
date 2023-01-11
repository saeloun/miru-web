
# frozen_string_literal: true

class InternalApi::V1::Reports::OutstandingOverdueInvoicesController < InternalApi::V1::ApplicationController
  def index
    authorize :report
    render :index,
      locals: {
        clients:,
        summary: OutstandingOverdueInvoicesReportPresenter.new(clients).summary
      },
      status: :ok
  end

  private

    def clients
      @_clients ||= current_company.clients.order("name asc").includes(:invoices).map do |client|
                      client.outstanding_and_overdue_invoices
                    end
    end
end
