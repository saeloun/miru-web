
# frozen_string_literal: true

class InternalApi::V1::Reports::OutstandingOverdueInvoicesController < InternalApi::V1::ApplicationController
  before_action :load_clients, only: [:index]

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
      @_clients ||= @clients.order("name asc").includes(:invoices).map do |client|
                      client
                        .outstanding_and_overdue_invoices
                        .merge({ id: client.id, name: client.name, logo: client.logo_url })
                    end
    end

    def load_clients
      if params[:client]
        @clients = current_company.clients.with_ids(params[:client]).presence || []
      else
        @clients = current_company.clients
      end
    end
end
