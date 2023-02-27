# frozen_string_literal: true

module Reports::ClientRevenues
  class IndexService
    attr_reader :params, :current_company

    def initialize(params, current_company)
      @params = params
      @current_company = current_company
    end

    def process
      {
        clients:,
        summary:
      }
    end

    private

      def clients
        current_clients.order("name asc").includes(:invoices).map do |client|
          client.payment_summary(duration_params)
        end
      end

      def summary
        total_paid_amount = clients.pluck(:paid_amount).sum
        total_outstanding_amount = clients.pluck(:outstanding_amount).sum
        {
          total_paid_amount:,
          total_outstanding_amount:,
          total_revenue: total_paid_amount + total_outstanding_amount
        }
      end

      def current_clients
        @_current_clients ||= client_ids_params.blank? ?
        current_company.clients : current_company.clients.where(id: client_ids_params)
      end

      def client_ids_params
        JSON.parse(params[:client_ids]) if params[:client_ids].present?
      end

      def duration_params
        if params[:duration_from].present? && params[:duration_to].present?
          params[:duration_from].to_date..params[:duration_to].to_date
        end
      end
  end
end
