# frozen_string_literal: true

class InternalApi::V1::Reports::AccountsAgingController < InternalApi::V1::ApplicationController
  include Timesheet
  include UtilityFunctions

  def index
    authorize :report
    render :index, locals: { clients:, invoice_overdue: }, status: :ok
  end

  private

    def clients
      @_clients ||= current_company.clients.order(name: :asc).uniq
    end

    def invoice_overdue
      Invoice.overdue.for_clients(clients)
    end
end
