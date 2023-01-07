# frozen_string_literal: true

module Invoices
  class IndexService < ApplicationService
    attr_reader :filter_params, :current_company

    def initialize(filter_params, current_company)
      @filter_params = filter_params
      @current_company = current_company
     end

    def process
      {
        invoices_query:,
        pagination_details:,
        recently_updated_invoices:,
        summary: current_company.overdue_and_outstanding_and_draft_amount
      }
    end

    private

      def invoices_query
        custom_filters = Invoices::Filters.new(filter_params).process
        where_clause = set_default_filters.merge(custom_filters)
        per_page = filter_params[:invoices_per_page].to_i <= 0 ? nil : filter_params[:invoices_per_page].to_i

        @_invoices_query = Invoice.search(
          search_term,
          fields: [:invoice_number, :client_name],
          match: :word_middle,
          where: where_clause,
          order: { created_at: :desc },
          page: filter_params[:page],
          per_page:,
          includes: [:client]
        )
      end

      def recently_updated_invoices
        current_company.invoices.kept
          .includes(:client)
          .order("updated_at desc")
          .limit(10)
      end

      def search_term
        @_search_term = filter_params[:query].presence || "*"
      end

      def set_default_filters
        { id: current_company.invoices.kept.pluck(:id).uniq }
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
