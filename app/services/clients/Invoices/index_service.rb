# frozen_string_literal: true

module Clients
  class Invoices::IndexService < ApplicationService
    attr_reader :params, :current_company, :client

    def initialize(client, current_company, params)
      @client = client
      @current_company = current_company
      @params = params
     end

    def process
      {
        invoices_query:,
        pagination_details:
      }
    end

    private

      def invoices_query
        filters = Clients::Invoices::Filters.new(client, current_company, params)
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

      def pagination_details
        {
          pages: invoices_query.total_pages,
          first: invoices_query.first_page?,
          prev: invoices_query.prev_page,
          next: invoices_query.next_page,
          last: invoices_query.last_page?
        }
      end
  end
end
