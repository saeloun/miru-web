
# frozen_string_literal: true

module Reports::OutstandingOverdueInvoices
  class IndexService
    attr_reader :current_company

    def initialize(current_company)
      @current_company = current_company
    end

    def process
      clients = current_company.clients.order("name asc").includes(:invoices).map do |client|
        client.outstanding_and_overdue_invoices.merge({ name: client.name, logo: client.logo_url })
      end
      summary = OutstandingOverdueInvoicesReportPresenter.new(clients).summary

      { clients:, summary:, currency: current_company.base_currency }
    end
  end
end
