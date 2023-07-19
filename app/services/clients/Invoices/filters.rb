# frozen_string_literal: true

module Clients
  class Invoices::Filters < ApplicationService
    attr_reader :client, :current_company, :params, :where_clause

    def initialize(client, current_company, params)
      @client = client
      @current_company = current_company
      @params = params
      @where_clause = {}
     end

    def process
      process_page_params
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

      def add_default_filters
        @where_clause[:company_id] = current_company.id
        @where_clause[:discarded_at] = nil
        @where_clause[:status] = ["paid", "viewed", "sent", "waived", "overdue"]
        @where_clause[:client_id] = [client.id]
      end
  end
end
