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
        pagination_details:,
        recently_updated_invoices:,
        summary: overdue_and_outstanding_and_draft_amount
      }
    end

    private

      def invoices_query
        filters = Invoices::Filters.new(current_company, params)
        filters.process

        @_invoices_query ||= Invoice.search(
          filters.search_term,
          fields: [:invoice_number, :client_name],
          match: :word_middle,
          where: filters.where_clause,
          order: { created_at: :desc },
          page: filters.page,
          per_page: filters.per_page,
          includes: [:client, :company]
        )
      end

      def recently_updated_invoices
        filters = Invoices::Filters.new(current_company, {})
        filters.process

        Invoice.search(
          where: filters.where_clause,
          order: { updated_at: :desc },
          limit: 10,
          includes: [:client]
        )
      end

      def pagination_details
        {
          pages: invoices_query.total_pages,
          first: invoices_query.first_page?,
          prev: invoices_query.prev_page,
          next: invoices_query.next_page,
          last: invoices_query.last_page?
        }
      end

      def overdue_and_outstanding_and_draft_amount
        currency = current_company.base_currency
        invoices = invoices_query.to_a
        status_and_amount = invoices.group_by(&:status).transform_values { |invoices| invoices.sum(&:amount) }
        status_and_amount.default = 0
        outstanding_amount = status_and_amount["sent"] + status_and_amount["viewed"] + status_and_amount["overdue"]
        {
          overdue_amount: status_and_amount["overdue"],
          outstanding_amount:,
          draft_amount: status_and_amount["draft"],
          currency:
        }
      end
  end
end
