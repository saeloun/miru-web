# frozen_string_literal: true

module Invoices
  class IndexService < ApplicationService
    include Pagy::Backend

    attr_reader :current_company, :params

    def initialize(current_company, params)
      @current_company = current_company
      @params = params
    end

    def process
      invoices = filtered_invoices
      pagy_metadata, paginated_invoices = paginated_invoices_for(invoices)

      {
        invoices: paginated_invoices,
        pagination_details: {
          page: pagy_metadata.page,
          pages: pagy_metadata.pages,
          total: pagy_metadata.count
        },
        summary: summary,
        recently_updated_invoices: recently_updated_invoices,
        recently_updated_total_count: pagy_metadata.count
      }
    end

    private

      def base_invoices
        current_company.invoices.kept.includes(:client)
      end

      def filtered_invoices
        invoices = base_invoices
        search_query = params[:query] || params[:search_term]

        if search_query.present?
          invoices = invoices.search(search_query)
        elsif legacy_query_params.present?
          invoices = apply_legacy_filters(invoices)
        end

        invoices = apply_status_filters(invoices)
        invoices = apply_date_filter(invoices)
        apply_client_filters(invoices)
      end

      def legacy_query_params
        raw_params = params[:q]
        return unless raw_params.is_a?(ActionController::Parameters) || raw_params.is_a?(Hash)

        raw_params
      end

      def apply_legacy_filters(invoices)
        invoices = invoices.where(client_id: legacy_query_params[:client_id_eq]) if legacy_query_params[:client_id_eq].present?
        invoices = invoices.where(status: legacy_query_params[:status_eq]) if legacy_query_params[:status_eq].present?

        if legacy_query_params[:invoice_number_cont].present?
          search_term = ActiveRecord::Base.sanitize_sql_like(legacy_query_params[:invoice_number_cont].to_s)
          invoices = invoices.where("invoice_number ILIKE ?", "%#{search_term}%")
        end

        invoices
      end

      def apply_status_filters(invoices)
        return invoices.where(status: params[:status]) if params[:status].present?
        return invoices.where(status: params[:statuses]) if params[:statuses].present?

        invoices
      end

      def apply_date_filter(invoices)
        return invoices unless params[:date_range].present?

        date_range = DateRangeService.new(
          timeframe: params[:date_range],
          from: params[:from_date_range],
          to: params[:to_date_range]
        ).process

        invoices.where(issue_date: date_range)
      end

      def apply_client_filters(invoices)
        if params[:client_id].present?
          invoices.where(client_id: params[:client_id])
        elsif params[:client].present?
          client_ids = Array(params[:client])
          client_ids.empty? ? invoices : invoices.where(client_id: client_ids)
        elsif params[:client_ids].present?
          client_ids = Array(params[:client_ids])
          client_ids.empty? ? invoices : invoices.where(client_id: client_ids)
        else
          invoices
        end
      end

      def paginated_invoices_for(invoices)
        pagy(invoices, items: per_page, page:, overflow: :empty_page)
      rescue Pagy::OverflowError
        pagy(invoices.none, items: per_page, page: 1)
      end

      def page
        parsed_page = (params[:page] || 1).to_i
        parsed_page <= 0 ? 1 : parsed_page
      end

      def per_page
        parsed_per_page = (params[:invoices_per_page] || params[:per] || 10).to_i
        return 10 if parsed_per_page <= 0
        return 100 if parsed_per_page > 100

        parsed_per_page
      end

      def summary
        invoice_amounts = InvoiceAmountsSummary.process(current_company.invoices.kept)
        draft_amount = invoice_amounts[:draft_amount]
        outstanding_amount = invoice_amounts[:outstanding_amount]
        overdue_amount = invoice_amounts[:overdue_amount]
        total_amount = (draft_amount + outstanding_amount + overdue_amount).round(2)

        {
          draftAmount: draft_amount == 0 ? 0 : draft_amount.to_s,
          outstandingAmount: outstanding_amount == 0 ? 0 : outstanding_amount.to_s,
          overdueAmount: overdue_amount == 0 ? 0 : overdue_amount.to_s,
          totalAmount: total_amount == 0 ? 0 : total_amount.to_s,
          currency: current_company.base_currency
        }
      end

      def recently_updated_invoices
        current_company.invoices
          .kept
          .includes(:client)
          .order(updated_at: :desc, id: :desc)
          .limit(10)
      end
  end
end
