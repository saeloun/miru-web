# frozen_string_literal: true

module Invoices
  class Filters < ApplicationService
    CUSTOM_PARAM_LIST = %i[date_range status client]

    attr_reader :current_company, :filters, :params

    def initialize(current_company, params)
      @current_company = current_company
      @params = params
      @filters = {}
     end

    def process
      process_page_params
      add_custom_filters
      add_default_filters
    end

    def search_term
      params[:query].presence || "*"
    end

    def page
      params[:page]
    end

    def per_page
      return nil if params[:invoices_per_page] <= 0

      params[:invoices_per_page]
    end

    private

      def process_page_params
        params[:page] = params[:page].to_i
        params[:invoices_per_page] = params[:invoices_per_page].to_i
      end

      def add_custom_filters
        CUSTOM_PARAM_LIST.each do |key|
          if params[key].present?
            @filters[:key] = public_send("#{key}_filter")
          end
        end
      end

      def add_default_filters
        @filters[:company_id] = current_company.id
        @filters[:discarded_at] = nil
      end

      def client_filter
        { client_id: params[:client] }
      end

      def date_range_filter
        {
          issue_date: DateRangeService.new(
            timeframe: params[:date_range], from: params[:from_date_range],
            to: params[:to_date_range]).process
        }
      end

      def status_filter
        { status: params[:status] }
      end
  end
end
