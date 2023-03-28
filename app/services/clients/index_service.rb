# frozen_string_literal: true

module Clients
  class IndexService < ApplicationService
    attr_reader :params, :current_company

    def initialize(current_company, params)
      @current_company = current_company
      @params = params
    end

    def process
      @_clients ||= clients

      {
        client_details:,
        total_minutes:,
        overdue_outstanding_amount:
      }
    end

    private

      def clients
        if params[:q].present?
          search_clients(search_term, where_clause)
        else
          current_company.clients
        end
      end

      def search_term
        @_search_term = params[:q].presence || "*"
      end

      def where_clause
        { company_id: current_company.id }
      end

      def search_clients(search_term, where_clause)
        Client.search(
          search_term,
          fields: [:name, :email],
          match: :text_middle,
          where: where_clause
        )
      end

      def client_details
        clients.map { |client| client.client_detail(params[:time_frame]) }
      end

      def total_minutes
        (client_details.map { |client| client[:minutes_spent] }).sum
      end

      def overdue_outstanding_amount
        current_company.overdue_and_outstanding_and_draft_amount
      end
  end
end
