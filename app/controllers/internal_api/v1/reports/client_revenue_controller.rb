
# frozen_string_literal: true

class InternalApi::V1::Reports::ClientRevenueController < InternalApi::V1::ApplicationController
  def index
    authorize :report
    render :index, locals: { clients:, summary: }, status: :ok
  end

  private

    def clients
      @_clients ||= current_company.clients.order("name asc").includes(:invoices).map do |client|
                      client.payment_summary
                    end
    end

    def summary
      total_paid_amount = clients.pluck(:paid_amount).sum
      total_unpaid_amount = clients.pluck(:unpaid_amount).sum
      {
        total_paid_amount:,
        total_unpaid_amount:,
        total_revenue: total_paid_amount + total_unpaid_amount
      }
    end
end
