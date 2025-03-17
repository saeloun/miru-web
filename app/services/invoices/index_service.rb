# frozen_string_literal: true

module Invoices
  class IndexService < ApplicationService
    attr_reader :params, :current_company

    DEFAULT_ORDER = { created_at: :desc }.freeze

    def initialize(params, current_company)
      @params = params
      @current_company = current_company
    end

    def process
      {
        invoices: fetch_invoices,
        pagination_details:,
        recently_updated_invoices: fetch_recently_updated_invoices,
        summary: calculate_summary
      }
    end

    private

      def fetch_invoices
        filters = Invoices::Filters.new(current_company, params)
        filters.process

        invoice_options = invoices_query(filters, page: filters.page, per_page: filters.per_page)

        @_fetch_invoices ||= Invoice.search(
          filters.search_term,
          **invoice_options
        )
      end

      def pagination_details
        {
          pages: fetch_invoices.total_pages,
          first: fetch_invoices.first_page?,
          prev: fetch_invoices.prev_page,
          next: fetch_invoices.next_page,
          last: fetch_invoices.last_page?,
          page: params[:page].to_i
        }
      end

      def fetch_recently_updated_invoices
        filters = Invoices::Filters.new(current_company, {})
        filters.process

        invoice_options = invoices_query(filters, order: { updated_at: :desc }, limit: 10)

        Invoice.search(
          "*",
          **invoice_options
        )
      end

      def calculate_summary
        filters = Invoices::Filters.new(current_company, params)
        filters.process

        invoice_options = invoices_query(filters)

        search_invoices = Invoice.search(
          "*",
          **invoice_options
        )

        currency = current_company.base_currency
        invoices = search_invoices.to_a
        status_and_amount = invoices.group_by(&:status).transform_values { |invoices|
          invoices.sum { |invoice| invoice.base_currency_amount || invoice.amount }
        }
        status_and_amount.default = 0
        outstanding_amount = status_and_amount["sent"] + status_and_amount["viewed"] + status_and_amount["overdue"]
        {
          overdue_amount: status_and_amount["overdue"],
          outstanding_amount:,
          draft_amount: status_and_amount["draft"],
          currency:
        }
      end

      def invoices_query(filters, options = {})
        invoice_options = {
          fields: [:invoice_number, :client_name],
          match: :word_middle,
          where: filters.where_clause,
          order: options[:order] || DEFAULT_ORDER,
          includes: [:client, { client: :logo_attachment }, :company]
        }

        invoice_options[:page] = options[:page] if options[:page]
        invoice_options[:per_page] = options[:per_page] if options[:per_page]
        invoice_options[:limit] = options[:limit] if options[:limit]

        invoice_options
      end
  end
end
