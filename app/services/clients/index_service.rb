# frozen_string_literal: true

module Clients
  class IndexService < ApplicationService
    attr_reader :current_company, :query, :time_frame

    def initialize(current_company, query, time_frame)
      @current_company = current_company
      @query = query
      @time_frame = time_frame
    end

    def process
      {
        client_details:,
        total_minutes:,
        overdue_outstanding_amount:,
        users_not_in_client_members:
      }
    end

    private

      def clients_list
        if query.present?
          search_clients(search_term, where_clause).includes(:logo_attachment)
        else
          current_company.clients.includes(:logo_attachment)
        end
      end

      def search_term
        @_search_term = query.presence || "*"
      end

      def where_clause
        { company_id: current_company.id }
      end

      def search_clients(search_term, where_clause)
        Client.search(
          search_term,
          fields: [:name, :email],
          match: :word_middle,
          where: where_clause
        )
      end

      def client_details
        @_client_details ||= clients_list.where(discarded_at: nil).map { |client|
                                client.client_detail(time_frame)
                              }
      end

      def total_minutes
        (client_details.map { |client| client[:minutes_spent] }).sum
      end

      def overdue_outstanding_amount
        current_company.overdue_and_outstanding_and_draft_amount
      end

      def users_not_in_client_members
        users_with_client_role = current_company.users.includes(:roles).where(roles: { name: "client" })
        users_with_client_role.where.not(id: current_company.client_members.pluck(:user_id))
      end
  end
end
