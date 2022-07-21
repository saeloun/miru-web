
# frozen_string_literal: true

class InternalApi::V1::Reports::ClientRevenuesController < InternalApi::V1::ApplicationController
  def index
    authorize :report
    render :index, locals: { clients:, summary: }, status: :ok
  end

  private

    def clients
      current_company.clients.where(id: client_ids_params).order("name asc").includes(:invoices).map do |client|
        client.payment_summary(duration_params)
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

    def client_ids_params
      JSON.parse(params.require(:client_ids))
    end

    def duration_params
      params.require(:duration_from).to_date..params.require(:duration_to).to_date
    end
end
