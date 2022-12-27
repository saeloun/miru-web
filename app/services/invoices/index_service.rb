# frozen_string_literal: true

module Invoices
  class IndexService < ApplicationService
    attr_reader :params, :current_company

    def initialize(params, current_company)
      @params = params
      @current_company = current_company
    end

    def process
      {
        invoices_query:,
        recently_updated_invoices:,
        summary: current_company.overdue_and_outstanding_and_draft_amount
      }
    end

    private

      def recently_updated_invoices
        current_company.invoices
          .includes(:client)
          .order("updated_at desc")
          .limit(10)
      end

      def invoices_query
        @_invoices_query ||= current_company.invoices.includes(:client)
          .search(params[:query])
          .issue_date_range(from_to_date(params[:from_to]))
          .for_clients(params[:client_ids])
          .with_statuses(params[:statuses])
          .order(created_at: :desc)
      end

      def from_to_date(from_to)
        if from_to
          DateRangeService.new(timeframe: from_to[:date_range], from: from_to[:from], to: from_to[:to]).process
        end
      end
  end
end
