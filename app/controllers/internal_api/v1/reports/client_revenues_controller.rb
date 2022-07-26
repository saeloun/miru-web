
# frozen_string_literal: true

class InternalApi::V1::Reports::ClientRevenuesController < InternalApi::V1::ApplicationController
  def index
    authorize :report
    render :index, locals: { clients:, summary: }, status: :ok
  end

  private

    def clients
      current_company.clients.where(id: client_ids).order("name asc").includes(:invoices).map do |client|
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

    def client_ids
      client_ids_params.empty? ? current_company.clients.pluck(:id) : client_ids_params
    end

    def client_ids_params
      JSON.parse(params[:client_ids]) if params[:client_ids].present?
    end

    def duration_params
      if params[:duration_from].present?
        params[:duration_from].to_date..params[:duration_to].to_date
      else
        current_company.created_at..Date.today
      end
    end
end
